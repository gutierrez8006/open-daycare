import Link from "next/link";
import { notFound } from "next/navigation";
import { getChild } from "@/data/children";
import ActivateAccountForm from "@/components/activate-account-form";

export default function ActivateAccountPage() {
  const child = getChild("mateo-fernandez");
  if (!child) notFound();

  const firstName = child.name.split(" ")[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-10">
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
            style={{ background: child.avatar.bg, color: child.avatar.fg }}
          >
            {child.initial}
          </div>
          <div>
            <div className="text-[13px] text-muted-strong">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {firstName} · Sala {child.room}
            </div>
          </div>
        </div>

        <ActivateAccountForm />

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
