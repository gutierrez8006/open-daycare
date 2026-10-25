import Link from "next/link";
import {
  ageFromBirthDate,
  allergyBadge,
  avatarFor,
} from "@/components/kid-card";
import KidParentsCard, {
  type KidParentEntry,
} from "@/components/kid-parents-card";

export type KidProfileData = {
  id: string;
  fullName: string;
  birthDate: string;
  enrolledAt: string;
  roomName: string;
  allergyTags: string[];
  medicalNotes: string | null;
};

function formatBirthDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ de /g, " ");
}

function formatEnrolledAt(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });
}

export default function KidProfile({
  child,
  parents,
  canInvite,
}: {
  child: KidProfileData;
  parents: KidParentEntry[];
  canInvite: boolean;
}) {
  const age = ageFromBirthDate(child.birthDate);
  const avatar = avatarFor(child.id);
  const initial = child.fullName.trim().charAt(0).toUpperCase();
  const hasNotes = Boolean(child.medicalNotes?.trim());

  return (
    <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px] [line-height:normal]">
      <Link
        href="/staff/kids"
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
                backgroundColor: avatar.bg,
                color: avatar.fg,
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1 basis-[160px]">
              <h1 className="font-display text-[28px] font-semibold text-ink">
                {child.fullName}
              </h1>
              <p className="mt-[3px] text-[15px] text-muted-strong">
                {age} {age === 1 ? "año" : "años"} · Sala {child.roomName}
              </p>
              {child.allergyTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {child.allergyTags.map((tag) => {
                    const badge = allergyBadge(tag);
                    return (
                      <span
                        key={tag}
                        className="rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
                        style={{ backgroundColor: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <a
              href="#"
              className="flex-none rounded-[12px] border-[1.5px] border-line bg-card px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
            >
              Editar
            </a>
          </div>

          {hasNotes && (
            <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] px-[18px] py-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <AlertIcon />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                  {child.medicalNotes}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[16px] border border-line bg-card">
            <ProfileRow
              label="Fecha de nacimiento"
              value={formatBirthDate(child.birthDate)}
            />
            <ProfileRow label="Sala" value={child.roomName} />
            <ProfileRow label="Ingreso" value={formatEnrolledAt(child.enrolledAt)} />
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

          <KidParentsCard
            childId={child.id}
            childName={child.fullName}
            parents={parents}
            canInvite={canInvite}
          />
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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4-1.4M4.9 19.1l1.4-1.4M19.1 4.9l-1.4 1.4M4.9 4.9l1.4 1.4M17.7 17.7l-1.4-1.4" />
    </svg>
  );
}
