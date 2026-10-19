import { notFound } from "next/navigation";
import KidProfile, { type KidProfileData } from "@/components/kid-profile";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, room:rooms(name)",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load child: ${error.message}`);
  }

  const room = (data?.room ?? null) as { name: string } | null;
  if (!data || !room) notFound();

  const child: KidProfileData = {
    id: data.id,
    fullName: data.full_name,
    birthDate: data.birth_date,
    enrolledAt: data.enrolled_at,
    roomName: room.name,
    allergyTags: data.allergy_tags ?? [],
    medicalNotes: data.medical_notes,
  };

  return <KidProfile child={child} />;
}
