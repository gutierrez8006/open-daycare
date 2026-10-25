import Sidebar, { type UserInfo } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";
import { getCurrentDaycare } from "@/utils/current-daycare";
import type { FeedPostKid } from "@/utils/post-kinds";
import { redirect } from "next/navigation";

/**
 * Layout del panel staff. Guard defensivo de segunda línea (el proxy ya valida
 * por URL): re-verifica el rol contra users.role (fuente de verdad en BD) antes
 * de renderizar, reutilizando el select de perfil que ya hace.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("full_name, role, daycare_id")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile || profile.role !== "staff") {
    redirect("/");
  }

  let userInfo: UserInfo | null = null;
  let kids: FeedPostKid[] = [];
  let daycareId = "";

  const daycare = await getCurrentDaycare();
  daycareId = profile.daycare_id;
  userInfo = {
    fullName: profile.full_name,
    role: profile.role,
    daycareName: daycare?.name ?? "",
  };
  const { data: childrenRows } = await supabase
    .from("children")
    .select("id, full_name");
  kids = (childrenRows ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
  }));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userInfo={userInfo} kids={kids} daycareId={daycareId} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
