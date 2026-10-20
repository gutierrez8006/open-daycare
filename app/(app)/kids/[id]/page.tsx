import { notFound } from "next/navigation";
import KidProfile, { type KidProfileData } from "@/components/kid-profile";
import type { KidParentEntry } from "@/components/kid-parents-card";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Relationship = KidParentEntry["relationship"];

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [childResult, profileResult, linkedResult, pendingResult] =
    await Promise.all([
      supabase
        .from("children")
        .select(
          "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, room:rooms(name)",
        )
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle(),
      user
        ? supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("parent_children")
        .select("id, relationship, created_at, parent:users(full_name)")
        .eq("child_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invitations")
        .select("id, full_name, relationship, created_at")
        .eq("child_id", id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true }),
    ]);

  const { data, error } = childResult;
  if (error) {
    throw new Error(`Failed to load child: ${error.message}`);
  }

  const room = (data?.room ?? null) as { name: string } | null;
  if (!data || !room) notFound();

  if (linkedResult.error) {
    throw new Error(`Failed to load parents: ${linkedResult.error.message}`);
  }
  if (pendingResult.error) {
    throw new Error(
      `Failed to load pending invitations: ${pendingResult.error.message}`,
    );
  }

  const linkedParents = (linkedResult.data ?? []).map((row) => {
    const parent = row.parent as
      | { full_name: string }
      | { full_name: string }[]
      | null;
    const parentName = Array.isArray(parent)
      ? parent[0]?.full_name
      : parent?.full_name;
    return {
      id: row.id as string,
      name: parentName ?? "Padre vinculado",
      relationship: row.relationship as Relationship,
      status: "active" as const,
    };
  });

  const pendingParents = (pendingResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.full_name as string,
    relationship: row.relationship as Relationship,
    status: "pending" as const,
  }));

  const parents: KidParentEntry[] = [...linkedParents, ...pendingParents];
  const role = profileResult.data?.role;
  const canInvite = role === "staff" || role === "admin";

  const child: KidProfileData = {
    id: data.id,
    fullName: data.full_name,
    birthDate: data.birth_date,
    enrolledAt: data.enrolled_at,
    roomName: room.name,
    allergyTags: data.allergy_tags ?? [],
    medicalNotes: data.medical_notes,
  };

  return <KidProfile child={child} parents={parents} canInvite={canInvite} />;
}
