import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "@/app/(auth)/login/actions";

/**
 * Layout del panel familia (placeholder mínimo, SPEC role-based-panel-access).
 * Guard defensivo de segunda línea: si el proxy no bloqueó, aquí se re-verifica
 * el rol (fuente de verdad: users.role en BD) antes de renderizar.
 */
export const dynamic = "force-dynamic";
export default async function FamiliaLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", authUser.id)
    .single();

  if (!profile || profile.role !== "parent") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#F6ECDF]">
      <aside className="w-full flex-none bg-[#FFFDF9] border-b lg:border-b-0 lg:border-r border-[#ECE0D0] lg:sticky lg:top-0 lg:h-screen lg:w-[248px] flex flex-col px-4 py-6">
        <Link
          href="/familia"
          className="flex items-center gap-2.5 px-2 pb-5"
        >
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block font-display text-[17px] font-semibold text-[#3F362E]">
              OpenDayCare
            </span>
            <span className="mt-0.5 block text-[11.5px] text-[#A89A8B]">
              Familia
            </span>
          </span>
        </Link>

        <nav className="mt-1 flex flex-1 flex-col gap-1">
          <Link
            href="/familia"
            className="flex items-center gap-3 rounded-xl bg-[#FBE3D8] px-3 py-2.5 text-[14.5px] font-extrabold text-[#D9583C]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
            Feed
          </Link>
          <Link
            href="/familia/cuenta"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-[#6E6359]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Mi cuenta
          </Link>
        </nav>

        <div className="hidden border-t border-[#ECE0D0] pt-3.5 lg:block">
          <form action={signOutAction} className="flex items-center gap-2.5 px-2 py-1.5">
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#C9B6E8] font-display text-[16px] font-semibold text-white">
              {profile.full_name.trim()[0]?.toUpperCase() ?? "?"}
            </span>
            <button
              type="submit"
              title="Cerrar sesión"
              className="ml-auto flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#94887B]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
