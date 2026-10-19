import Sidebar, { type UserInfo } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";
import { getCurrentDaycare } from "@/utils/current-daycare";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userInfo: UserInfo | null = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      const daycare = await getCurrentDaycare();
      userInfo = {
        fullName: profile.full_name,
        role: profile.role,
        daycareName: daycare?.name ?? "",
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userInfo={userInfo} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
