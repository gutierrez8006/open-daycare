import Sidebar, { type UserInfo } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";
import { getCurrentDaycare } from "@/utils/current-daycare";
import type { FeedPostKid } from "@/utils/post-kinds";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userInfo: UserInfo | null = null;
  let kids: FeedPostKid[] = [];
  let daycareId = "";
  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, role, daycare_id")
      .eq("id", authUser.id)
      .single();

    if (profile) {
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
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userInfo={userInfo} kids={kids} daycareId={daycareId} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
