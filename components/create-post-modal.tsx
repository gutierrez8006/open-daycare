"use client";

import { useState } from "react";
import { children } from "@/data/children";

const roomKids = children.slice(0, 3);
const allKidIds = roomKids.map((child) => child.id);

const labelClass =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

export default function CreatePostModal({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
}) {
  const [selectedKids, setSelectedKids] = useState<string[]>([]);

  if (!open) return null;

  const toggleKid = (id: string) => {
    setSelectedKids((current) =>
      current.includes(id)
        ? current.filter((kidId) => kidId !== id)
        : [...current, id],
    );
  };

  const toggleAllKids = () => {
    setSelectedKids((current) =>
      current.length === roomKids.length ? [] : [...allKidIds],
    );
  };

  const allKidsSelected = selectedKids.length === roomKids.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,.45)] px-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Nueva publicación"
        className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-[#3F362E]">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={onPublish}
            className="text-[15px] font-extrabold text-[#D9583C]"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className={labelClass}>PARA</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {roomKids.map((child) => {
              const selected = selectedKids.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleKid(child.id)}
                  className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-[14px] font-bold ${
                    selected
                      ? "border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{ background: child.avatar.bg, color: child.avatar.fg }}
                  >
                    {child.initial}
                  </span>
                  {child.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={allKidsSelected}
              onClick={toggleAllKids}
              className={`rounded-full border-[1.5px] px-4 py-1.5 text-[14px] font-bold ${
                allKidsSelected
                  ? "border-[#3F362E] bg-[#3F362E] text-white"
                  : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          {/* Secciones TIPO/DESCRIPCIÓN/FOTOS (Paso 3) */}
        </div>
      </div>
    </div>
  );
}
