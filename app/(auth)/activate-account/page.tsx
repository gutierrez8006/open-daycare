import Link from "next/link";
import ActivateAccountForm from "@/components/activate-account-form";
import { createClient } from "@/utils/supabase/server";

type InvitationPreview = {
  child_name: string;
  room_name: string;
  daycare_name: string;
  email: string;
  expires_at: string;
};

export default async function ActivateAccountPage({
  searchParams,
}: PageProps<"/activate-account">) {
  const params = await searchParams;
  const rawCode = params.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  let preview: InvitationPreview | null = null;
  if (code?.trim()) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_invitation_preview", {
      p_code: code,
    });
    if (!error) {
      preview = ((data ?? [])[0] ?? null) as InvitationPreview | null;
    }
  }

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-6 md:p-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
            <LogoIcon />
          </div>

          <h1 className="font-display text-[32px] font-semibold leading-[1.15] text-ink">
            Invitación no válida
          </h1>
          <p className="mt-2 mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
            El código no existe, ya se usó o venció. Pedile a la guardería que te
            envíe una nueva invitación.
          </p>

          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const firstName = preview.child_name.split(" ")[0];
  const initial = preview.child_name.trim().charAt(0).toUpperCase();
  const normalizedCode = code?.trim().toUpperCase() ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-6 md:p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <LogoIcon />
        </div>

        <h1 className="font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mt-2 mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-3.5 rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full font-display text-[19px] font-semibold"
            style={{ background: "#FBE3D8", color: "#C5503A" }}
          >
            {initial}
          </div>
          <div>
            <div className="text-[13px] text-muted-strong">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {firstName} · Sala {preview.room_name}
            </div>
            <div className="text-[12.5px] text-muted-strong">
              {preview.daycare_name}
            </div>
          </div>
        </div>

        <ActivateAccountForm code={normalizedCode} email={preview.email} />

        <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-[#C5503A]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg
      width="30"
      height="30"
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
  );
}
