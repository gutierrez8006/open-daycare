import type { Child } from "@/data/children";
import { allergyColors, allergyLabels } from "@/data/children";

const LINK_BADGE = { bg: "#F9D2DE", fg: "#C56486" };

function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  return `${count} ${count === 1 ? "padre vinculado" : "padres vinculados"}`;
}

export default function KidCard({ child }: { child: Child }) {
  const allergy = child.allergies[0];
  const needsLinkBadge = !allergy && child.parents.length === 0;

  const badge = allergy
    ? { label: allergyLabels[allergy], ...allergyColors[allergy] }
    : needsLinkBadge
      ? { label: "VINCULAR", ...LINK_BADGE }
      : null;

  return (
    <a
      href={`/kids/${child.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-card p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: child.avatar.bg, color: child.avatar.fg }}
      >
        {child.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[16px] font-semibold text-ink">
          {child.name}
        </div>
        <div className="truncate text-[13px] text-muted">
          {child.ageYears} años · {parentsLabel(child.parents.length)}
        </div>
      </div>
      {badge ? (
        <span
          className="flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
          style={{ backgroundColor: badge.bg, color: badge.fg }}
        >
          {badge.label}
        </span>
      ) : (
        <ChevronIcon />
      )}
    </a>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="flex-none"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
