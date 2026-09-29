import Link from "next/link";
import type { Child, ParentStatus } from "@/data/children";

const PARENT_AVATAR_COLORS = ["#C9B6E8", "#A9C7E8"];

const statusBadge: Record<ParentStatus, { label: string; className: string }> =
  {
    active: { label: "ACTIVA", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
    pending: { label: "PENDIENTE", className: "bg-[#F7E7A6] text-[#9A7B1E]" },
  };

function relationLabel(relation: "mother" | "father"): string {
  return relation === "mother" ? "Mamá" : "Papá";
}

function statusText(parent: Child["parents"][number]): string {
  if (parent.status === "pending") return "invitación enviada";
  return parent.relation === "mother" ? "activa" : "activo";
}

export default function KidProfile({ child }: { child: Child }) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
      <Link
        href="/kids"
        className="mb-5 inline-flex items-center gap-[7px] text-[14px] font-bold text-muted-strong"
      >
        <ChevronLeftIcon />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        <div className="flex min-w-0 flex-1 basis-[300px] flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-[18px]">
            <div
              className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
              style={{
                backgroundColor: child.avatar.bg,
                color: child.avatar.fg,
              }}
            >
              {child.initial}
            </div>
            <div className="min-w-0 flex-1 basis-[180px]">
              <h1 className="font-display text-[28px] font-semibold text-ink">
                {child.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-muted-strong">
                {child.ageYears} años · Sala {child.room}
              </p>
            </div>
            <a
              href="#"
              className="flex-none rounded-[12px] border-[1.5px] border-line bg-card px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
            >
              Editar
            </a>
          </div>

          {child.allergyNotes && (
            <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] px-[18px] py-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <AlertIcon />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                  {child.allergyNotes}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[16px] border border-line bg-card">
            <ProfileRow label="Fecha de nacimiento" value={child.birthDate} />
            <ProfileRow label="Sala" value={child.room} />
            <ProfileRow label="Ingreso" value={child.joined} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-[14px] lg:w-[300px] lg:flex-none">
          <a
            href="#"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink p-[13px] text-[15px] font-extrabold text-white"
          >
            <SunIcon />
            Resumen del día
          </a>

          <div className="rounded-[16px] border border-line bg-card p-[18px]">
            <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-[14px]">
              {child.parents.length === 0 && (
                <p className="text-[13.5px] text-muted">
                  Sin padres vinculados todavía.
                </p>
              )}
              {child.parents.map((parent, index) => {
                const badge = statusBadge[parent.status];
                return (
                  <div key={parent.id} className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          PARENT_AVATAR_COLORS[index % PARENT_AVATAR_COLORS.length],
                      }}
                    >
                      {parent.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-extrabold text-ink">
                        {parent.name}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {relationLabel(parent.relation)} ·{" "}
                        {statusText(parent)}
                      </div>
                    </div>
                    <span
                      className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
              <a
                href="#"
                className="flex items-center gap-3 pt-2"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                  <PlusIcon />
                </span>
                <span className="text-[14.5px] font-extrabold text-[#C5503A]">
                  Vincular otro padre
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#F0E6D8] px-[18px] py-[15px] last:border-b-0">
      <span className="text-[14.5px] text-muted-strong">{label}</span>
      <span className="text-[14.5px] font-extrabold text-ink">{value}</span>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
