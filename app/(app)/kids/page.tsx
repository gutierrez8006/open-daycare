import AddKidModal, { type AddKidRoom } from "@/components/add-kid-modal";
import KidsDirectory from "@/components/kids-directory";
import type { KidListItem } from "@/components/kid-card";
import { createClient } from "@/utils/supabase/server";
import { getCurrentDaycare } from "@/utils/current-daycare";

const WRITABLE_ROLES = new Set(["staff", "admin"]);

export default async function KidsPage() {
  const supabase = await createClient();
  const daycare = await getCurrentDaycare();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data, error }, { data: profile }, { data: roomRows }] =
    await Promise.all([
      supabase
        .from("children")
        .select("id, room_id, full_name, birth_date, allergy_tags")
        .eq("status", "active")
        .order("full_name"),
      supabase
        .from("users")
        .select("role")
        .eq("id", user?.id ?? "")
        .maybeSingle(),
      supabase
        .from("rooms")
        .select("id, name")
        .eq("daycare_id", daycare?.id ?? "")
        .order("created_at"),
    ]);

  if (error) {
    throw new Error(`Failed to load children: ${error.message}`);
  }

  const children = (data ?? []) as KidListItem[];
  const rooms = (roomRows ?? []) as AddKidRoom[];
  const canAddKids = WRITABLE_ROLES.has(profile?.role as string);

  return (
    <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px] [line-height:normal]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-brand">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        {canAddKids && <AddKidModal rooms={rooms} />}
      </div>

      <KidsDirectory items={children} daycareName={daycare?.name ?? ""} />
    </div>
  );
}
