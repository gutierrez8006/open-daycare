"use client";

import { useCallback, useEffect, useState } from "react";
import { children } from "@/data/children";

const roomKids = children.slice(0, 3);
const allKidIds = roomKids.map((child) => child.id);

const labelClass =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

const errorClass = "mt-1.5 text-[12px] font-bold text-[#D9583C]";

type CreatePostErrors = {
  kids?: string;
  kinds?: string;
  description?: string;
};

type PostKind =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

const postKinds: { id: PostKind; label: string; bg: string; fg: string }[] = [
  { id: "meal", label: "Comida", bg: "#9A7B1E", fg: "#FFFFFF" },
  { id: "nap", label: "Siesta", bg: "#E7DCF6", fg: "#7B5FC0" },
  { id: "activity", label: "Actividad", bg: "#2E89A6", fg: "#FFFFFF" },
  { id: "achievement", label: "Logro", bg: "#CFEBD8", fg: "#3E9B6C" },
  { id: "mood", label: "Ánimo", bg: "#F9D2DE", fg: "#C56486" },
  { id: "photo", label: "Foto", bg: "#FBD8CC", fg: "#D9684A" },
  { id: "announcement", label: "Anuncio", bg: "#CCD8F4", fg: "#4E72C8" },
];

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
  const [selectedKinds, setSelectedKinds] = useState<PostKind[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<CreatePostErrors>({});

  const resetForm = useCallback(() => {
    setSelectedKids([]);
    setSelectedKinds([]);
    setDescription("");
    setErrors({});
  }, []);

  const close = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  const clearError = (field: keyof CreatePostErrors) => {
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const toggleKid = (id: string) => {
    setSelectedKids((current) =>
      current.includes(id)
        ? current.filter((kidId) => kidId !== id)
        : [...current, id],
    );
    clearError("kids");
  };

  const toggleAllKids = () => {
    setSelectedKids((current) =>
      current.length === roomKids.length ? [] : [...allKidIds],
    );
    clearError("kids");
  };

  const allKidsSelected = selectedKids.length === roomKids.length;

  const toggleKind = (kind: PostKind) => {
    setSelectedKinds((current) =>
      current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind],
    );
    clearError("kinds");
  };

  const handlePublish = () => {
    const nextErrors: CreatePostErrors = {};
    if (selectedKids.length === 0) {
      nextErrors.kids = "Elegí al menos un niño";
    }
    if (selectedKinds.length === 0) {
      nextErrors.kinds = "Elegí al menos un tipo";
    }
    if (description.trim() === "") {
      nextErrors.description = "Escribí una descripción";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    resetForm();
    onPublish();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,.45)] px-4 py-10"
      onClick={close}
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
            onClick={close}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-[#3F362E]">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            className="text-[15px] font-extrabold text-[#D9583C]"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className={labelClass}>PARA</div>
          <div
            className={`flex flex-wrap gap-[9px] ${errors.kids ? "mb-1.5" : "mb-[22px]"}`}
          >
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
          {errors.kids && (
            <div className={`${errorClass} mb-[22px]`}>{errors.kids}</div>
          )}

          <div className={labelClass}>TIPO</div>
          <div
            className={`flex flex-wrap gap-[9px] ${errors.kinds ? "mb-1.5" : "mb-[22px]"}`}
          >
            {postKinds.map((kind) => {
              const selected = selectedKinds.includes(kind.id);
              return (
                <button
                  key={kind.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleKind(kind.id)}
                  className={`rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-extrabold ${
                    selected
                      ? "border-transparent"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                  style={
                    selected ? { background: kind.bg, color: kind.fg } : undefined
                  }
                >
                  {kind.label}
                </button>
              );
            })}
          </div>
          {errors.kinds && (
            <div className={`${errorClass} mb-[22px]`}>{errors.kinds}</div>
          )}

          <div className={labelClass}>DESCRIPCIÓN</div>
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError("description");
            }}
            placeholder="Contá cómo le fue hoy…"
            aria-invalid={Boolean(errors.description)}
            className={`${errors.description ? "mb-1.5" : "mb-[22px]"} min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-[#3F362E] outline-none placeholder:text-[#B6A99B]`}
          />
          {errors.description && (
            <div className={`${errorClass} mb-[22px]`}>{errors.description}</div>
          )}

          <div className={labelClass}>FOTOS</div>
          <div className="flex gap-3">
            <div className="flex h-[96px] w-[96px] items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <button
              type="button"
              className="flex h-[96px] w-[96px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[12px] text-[#B0A290]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C5503A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
