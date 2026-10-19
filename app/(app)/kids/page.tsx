import AddKidModal from "@/components/add-kid-modal";
import KidsDirectory from "@/components/kids-directory";
import type { KidListItem } from "@/components/kid-card";
import { createClient } from "@/utils/supabase/server";
import { getCurrentDaycare } from "@/utils/current-daycare";

export default async function KidsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .select("id, room_id, full_name, birth_date, allergy_tags")
    .eq("status", "active")
    .order("full_name");

  if (error) {
    throw new Error(`Failed to load children: ${error.message}`);
  }

  const daycare = await getCurrentDaycare();
  const children = (data ?? []) as KidListItem[];

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
        <AddKidModal />
      </div>

      <KidsDirectory items={children} daycareName={daycare?.name ?? ""} />
    </div>
  );
}
