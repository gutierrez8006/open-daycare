"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { sendInvitationEmail } from "@/utils/email/invitations";

const RELATIONSHIPS = ["mother", "father", "guardian"] as const;
type Relationship = (typeof RELATIONSHIPS)[number];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const CODE_ATTEMPTS = 5;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_ERROR =
  "No pudimos enviar la invitación. Revisá los datos e intentá de nuevo.";

export type CreateInvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relationship: Relationship;
};

export type CreateInvitationResult =
  | { ok: true; code: string; email: string }
  | { ok: false; error: string };

type InvitationRow = {
  id: string;
  code: string;
  expires_at: string;
};

function generateCode(): string {
  return Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");
}

/**
 * Base URL for the activation link: configured app URL first, then the
 * request origin. No domain is hardcoded, so production only changes env vars.
 */
async function resolveAppUrl(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return null;
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function cancelInvitation(invitationId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("status", "pending");
  if (error) {
    console.error("cancelInvitation failed", error);
  }
}

/**
 * Creates a parent invitation for a child: validates the caller, cancels any
 * previous pending invitation for the same email + child, stores a unique
 * 5-char code and sends the activation email. If the email fails, the
 * invitation is cancelled so no valid code is left undelivered.
 */
export async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  // Input comes from the client: validate at the trust boundary.
  const childId = String(input?.childId ?? "").trim();
  const fullName = String(input?.fullName ?? "").trim();
  const email = String(input?.email ?? "")
    .trim()
    .toLowerCase();
  const relationship = String(input?.relationship ?? "") as Relationship;

  if (!UUID_PATTERN.test(childId)) {
    return { ok: false, error: "No encontramos al niño." };
  }
  if (fullName === "") {
    return { ok: false, error: "Ingresá el nombre del padre o la madre" };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresá un email válido" };
  }
  if (!RELATIONSHIPS.includes(relationship)) {
    return { ok: false, error: "Seleccioná el vínculo" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, daycare_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) {
    return { ok: false, error: GENERIC_ERROR };
  }
  if (profile.role !== "staff" && profile.role !== "admin") {
    return {
      ok: false,
      error: "No tenés permiso para invitar padres.",
    };
  }

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name, room:rooms(daycare_id)")
    .eq("id", childId)
    .eq("status", "active")
    .maybeSingle();
  const room = (child?.room ?? null) as { daycare_id: string } | null;
  if (
    childError ||
    !child ||
    !room ||
    room.daycare_id !== profile.daycare_id
  ) {
    return { ok: false, error: "No encontramos al niño." };
  }

  // Only one valid invitation per child + email: cancel any previous pending one.
  const { error: cancelError } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", childId)
    .eq("email", email)
    .eq("status", "pending");
  if (cancelError) {
    return { ok: false, error: GENERIC_ERROR };
  }

  let invitation: InvitationRow | null = null;
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: childId,
        invited_by: user.id,
        full_name: fullName,
        email,
        relationship,
        code: generateCode(),
      })
      .select("id, code, expires_at")
      .single();

    if (!error && data) {
      invitation = data as InvitationRow;
      break;
    }
    // 23505 = unique_violation on invitations.code: try another code.
    if (error?.code !== "23505") {
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  if (!invitation) {
    return {
      ok: false,
      error: "No pudimos generar un código único. Intentá de nuevo.",
    };
  }

  const appUrl = await resolveAppUrl();
  if (!appUrl) {
    await cancelInvitation(invitation.id);
    return {
      ok: false,
      error: "No pudimos generar el enlace de activación.",
    };
  }

  const activationUrl = `${appUrl}/activate-account?code=${encodeURIComponent(
    invitation.code,
  )}`;
  const sent = await sendInvitationEmail({
    to: email,
    parentName: fullName,
    childName: child.full_name,
    code: invitation.code,
    expiresAt: new Date(invitation.expires_at),
    activationUrl,
  });

  if (!sent.ok) {
    await cancelInvitation(invitation.id);
    return { ok: false, error: sent.error };
  }

  revalidatePath(`/kids/${childId}`);
  return { ok: true, code: invitation.code, email };
}
