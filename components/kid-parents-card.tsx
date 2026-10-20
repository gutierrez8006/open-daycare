"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LinkParentModal from "@/components/link-parent-modal";

export type KidParentEntry = {
  id: string;
  name: string;
  relationship: "mother" | "father" | "guardian";
  status: "active" | "pending";
};

const PARENT_AVATAR_COLORS = ["#C9B6E8", "#A9C7E8"];

const statusBadge: Record<
  KidParentEntry["status"],
  { label: string; className: string }
> = {
  active: { label: "ACTIVA", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
  pending: { label: "PENDIENTE", className: "bg-[#F7E7A6] text-[#9A7B1E]" },
};

function relationLabel(relationship: KidParentEntry["relationship"]): string {
  if (relationship === "guardian") return "Tutor/a";
  return relationship === "mother" ? "Mamá" : "Papá";
}

function statusText(parent: KidParentEntry): string {
  if (parent.status === "pending") return "invitación enviada";
  return parent.relationship === "mother" ? "activa" : "activo";
}

export default function KidParentsCard({
  childId,
  childName,
  parents,
  canInvite,
}: {
  childId: string;
  childName: string;
  parents: KidParentEntry[];
  canInvite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const closeModal = useCallback(() => setOpen(false), []);
  const handleInvited = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="rounded-[16px] border border-line bg-card px-[18px] py-4">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.length === 0 && (
          <p className="text-[13.5px] text-muted">
            Sin padres vinculados todavía.
          </p>
        )}
        {parents.map((parent, index) => {
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
                <div className="text-[14.5px] font-extrabold text-ink">
                  {parent.name}
                </div>
                <div className="text-[12.5px] text-muted">
                  {relationLabel(parent.relationship)} · {statusText(parent)}
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
        {canInvite && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Vincular otro padre a ${childName}`}
            className="flex items-center gap-3 pt-2"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
              <PlusIcon />
            </span>
            <span className="text-[14.5px] font-extrabold text-[#C5503A]">
              Vincular otro padre
            </span>
          </button>
        )}
      </div>

      {open && (
        <LinkParentModal
          childId={childId}
          childName={childName}
          onClose={closeModal}
          onInvited={handleInvited}
        />
      )}
    </div>
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
