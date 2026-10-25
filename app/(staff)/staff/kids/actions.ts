"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type CreateKidInput = {
  fullName: string;
  birthDate: string; // "dd/mm/aaaa"
  roomId: string;
  allergies: string;
  medicalNotes: string;
};

export type CreateKidResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const GENERIC_ERROR =
  "No pudimos guardar el niño. Revisá los datos e intentá de nuevo.";

const BIRTH_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

const parseBirthDate = (
  value: string,
): { ok: true; iso: string } | { ok: false; error: string } => {
  if (!BIRTH_DATE_PATTERN.test(value)) {
    return { ok: false, error: "Usa una fecha válida (dd/mm/aaaa)" };
  }

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const isRealCalendarDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  if (!isRealCalendarDate) {
    return { ok: false, error: "Usa una fecha válida (dd/mm/aaaa)" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() > today.getTime()) {
    return { ok: false, error: "La fecha de nacimiento no puede ser futura" };
  }

  // Built manually (not toISOString) to keep the local calendar day.
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ok: true, iso: `${year}-${pad(month)}-${pad(day)}` };
};

/**
 * Inserts a new child into public.children for the authenticated user's daycare.
 * RLS (children_write_insert_staff) is the final guard; any DB failure maps to
 * a generic Spanish message without leaking Postgres details.
 */
export async function createKid(
  input: CreateKidInput,
): Promise<CreateKidResult> {
  // Input comes from the client: validate at the trust boundary, not just types.
  const fullName = String(input?.fullName ?? "").trim();
  const birthDate = String(input?.birthDate ?? "");
  const roomId = String(input?.roomId ?? "").trim();
  const allergies = String(input?.allergies ?? "");
  const medicalNotes = String(input?.medicalNotes ?? "").trim();

  if (fullName === "") {
    return { ok: false, error: "Ingresa el nombre completo" };
  }
  if (roomId === "") {
    return { ok: false, error: "Selecciona una sala" };
  }

  const parsed = parseBirthDate(birthDate);
  if (!parsed.ok) return parsed;

  const allergyTags = allergies
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("children")
    .insert({
      full_name: fullName,
      birth_date: parsed.iso,
      room_id: roomId,
      medical_notes: medicalNotes === "" ? null : medicalNotes,
      allergy_tags: allergyTags,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/staff/kids");
  return { ok: true, id: (created as { id: string }).id };
}
