"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActivateState = { error?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR =
  "No pudimos activar la cuenta. Revisá los datos e intentá de nuevo.";

type InvitationPreview = {
  child_name: string;
  room_name: string;
  daycare_name: string;
  email: string;
  expires_at: string;
};

function isExistingUserError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already")
  );
}

async function acceptInvitation(
  code: string,
): Promise<{ ok: true } | { ok: false }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_code: code,
  });

  if (!error && typeof data === "string" && data.length > 0) {
    return { ok: true };
  }

  // Retry with a fresh client in case the new session cookie was not visible yet.
  const retryClient = await createClient();
  const retry = await retryClient.rpc("accept_invitation", { p_code: code });
  if (!retry.error && typeof retry.data === "string" && retry.data.length > 0) {
    return { ok: true };
  }

  if (retry.error) {
    console.error("accept_invitation failed", retry.error);
  }
  return { ok: false };
}

export async function activateAccountAction(
  _prevState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const authorized = formData.get("authorized") === "on";

  if (code === "") {
    return { error: "El código de invitación no es válido." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Ingresá un email válido." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (!authorized) {
    return {
      error: "Tenés que autorizar el uso de fotos para continuar.",
    };
  }

  const supabase = await createClient();

  // Revalidate the code and the email against the invitation (never trust the form).
  const { data, error } = await supabase.rpc("get_invitation_preview", {
    p_code: code,
  });
  const preview = ((data ?? [])[0] ?? null) as InvitationPreview | null;
  if (error || !preview) {
    return {
      error: "El código no es válido o venció. Pedí una nueva invitación.",
    };
  }
  if (preview.email.toLowerCase() !== email) {
    return { error: "El email no coincide con la invitación." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        invitation_code: code,
        full_name: email.split("@")[0],
      },
    },
  });

  if (signUpError && !isExistingUserError(signUpError.message)) {
    console.error("signUp failed", signUpError);
    return { error: GENERIC_ERROR };
  }

  if (signUpError) {
    // The email already has an account (e.g. a second invitation): sign in and link.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        error:
          "Ese email ya tiene una cuenta. Ingresá la contraseña correcta o iniciá sesión para vincularte.",
      };
    }
  } else if (!signUpData.session) {
    return {
      error:
        "La cuenta se creó pero no pudimos iniciar sesión. Probá iniciando sesión y activá la invitación de nuevo.",
    };
  }

  const accepted = await acceptInvitation(code);
  if (!accepted.ok) {
    return {
      error:
        "No pudimos vincular la cuenta con el niño. Probá de nuevo o pedí una nueva invitación.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?activated=1");
}
