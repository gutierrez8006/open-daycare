import Link from "next/link";
import { allergyColors, allergyLabels, type Allergy } from "@/data/children";

export type KidListItem = {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  allergy_tags: string[];
};

const LINK_BADGE = { bg: "#F9D2DE", fg: "#C56486" };
const DEFAULT_ALLERGY_COLORS = { bg: "#FBD8CC", fg: "#D9684A" };

const AVATAR_PALETTE = [
  { bg: "#A9D9E8", fg: "#1F7A93" },
  { bg: "#F4B8CC", fg: "#C44A7A" },
  { bg: "#B9DEC4", fg: "#3E8B62" },
  { bg: "#F4DC8E", fg: "#9A7B1E" },
  { bg: "#C9B6E8", fg: "#7B5FC0" },
];

export function ageFromBirthDate(birthDate: string): number {
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return Math.max(age, 0);
}

export function avatarFor(id: string): { bg: string; fg: string } {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function allergyBadge(
  tag: string,
): { label: string; bg: string; fg: string } {
  const colors = allergyColors[tag as Allergy] ?? DEFAULT_ALLERGY_COLORS;
  return {
    label: allergyLabels[tag as Allergy] ?? tag.toUpperCase(),
    ...colors,
  };
}

export default function KidCard({ child }: { child: KidListItem }) {
  const initial = child.full_name.trim().charAt(0).toUpperCase();
  const age = ageFromBirthDate(child.birth_date);
  const avatar = avatarFor(child.id);
  const allergyTag = child.allergy_tags[0];

  const badge = allergyTag
    ? allergyBadge(allergyTag)
    : { label: "VINCULAR", ...LINK_BADGE };

  return (
    <Link
      href={`/kids/${child.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-card p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: avatar.bg, color: avatar.fg }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[16px] font-semibold text-ink">
          {child.full_name}
        </div>
        <div className="text-[13px] text-muted">
          {age} {age === 1 ? "año" : "años"} · sin padres vinculados
        </div>
      </div>
      <span
        className="flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
        style={{ backgroundColor: badge.bg, color: badge.fg }}
      >
        {badge.label}
      </span>
    </Link>
  );
}
