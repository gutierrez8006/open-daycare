"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postKinds } from "@/utils/post-kinds";
import type { FeedPostKid, PostKind } from "@/utils/post-kinds";

const labelClass =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

const errorClass = "mt-1.5 text-[12px] font-bold text-[#D9583C]";

type CreatePostErrors = {
  kids?: string;
  kinds?: string;
  description?: string;
  photos?: string;
};

const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB

type PendingPhoto = {
  file: File;
  previewUrl: string;
};

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  kids: FeedPostKid[];
  daycareId: string;
};

/* Paleta de avatar del mockup (SPEC 06), ciclando por índice para niños reales */
const kidAvatarPalette = [
  { bg: "#A9D9E8", fg: "#1F7A93" },
  { bg: "#F4B8CC", fg: "#B5587F" },
  { bg: "#B9DEC4", fg: "#3E9B6C" },
];

function initialOf(fullName: string): string {
  return fullName.trim()[0]?.toUpperCase() ?? "?";
}

export default function CreatePostModal({
  open,
  onClose,
  onPublish,
  kids,
  daycareId,
}: CreatePostModalProps) {
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<PostKind[]>([]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [errors, setErrors] = useState<CreatePostErrors>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedKids = [...kids].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es"),
  );

  const resetForm = useCallback(() => {
    setSelectedKids([]);
    setSelectedKinds([]);
    setDescription("");
    setPhotos((current) => {
      for (const photo of current) URL.revokeObjectURL(photo.previewUrl);
      return [];
    });
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
      current.length === sortedKids.length
        ? []
        : sortedKids.map((kid) => kid.id),
    );
    clearError("kids");
  };

  const allKidsSelected =
    sortedKids.length > 0 && selectedKids.length === sortedKids.length;

  const toggleKind = (kind: PostKind) => {
    setSelectedKinds((current) =>
      current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind],
    );
    clearError("kinds");
  };

  const addPhotos = (incoming: FileList | null) => {
    clearError("photos");
    if (!incoming || incoming.length === 0) return;

    const files = Array.from(incoming);
    const errorPhoto = (message: string) =>
      setErrors((current) => ({ ...current, photos: message }));

    if (files.some((file) => !ACCEPTED_MIME.has(file.type))) {
      errorPhoto("Solo podés subir imágenes JPG, PNG o WebP.");
      return;
    }
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      errorPhoto("Cada foto no puede superar 4MB.");
      return;
    }
    if (photos.length + files.length > MAX_PHOTOS) {
      errorPhoto("Máximo 10 fotos.");
      return;
    }

    setPhotos((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removePhoto = (index: number) => {
    clearError("photos");
    setPhotos((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, position) => position !== index);
    });
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
    if (
      selectedKinds.includes("photo") &&
      photos.length === 0
    ) {
      nextErrors.photos = "El tipo Foto requiere al menos una imagen.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // Step 10: valida fotos, sube al bucket y llama createPost
    void daycareId;
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-label="Agregar fotos"
          onChange={(event) => {
            addPhotos(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
        />
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
          {sortedKids.length === 0 ? (
            <div className={`${errorClass} mb-[22px]`}>
              No hay niños cargados todavía
            </div>
          ) : (
            <div
              className={`flex flex-wrap gap-[9px] ${errors.kids ? "mb-1.5" : "mb-[22px]"}`}
            >
              {sortedKids.map((kid, index) => {
                const selected = selectedKids.includes(kid.id);
                const avatar =
                  kidAvatarPalette[index % kidAvatarPalette.length];
                return (
                  <button
                    key={kid.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleKid(kid.id)}
                    className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-[14px] font-bold ${
                      selected
                        ? "border-[#3F362E] bg-[#3F362E] text-white"
                        : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                    }`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                      style={{ background: avatar.bg, color: avatar.fg }}
                    >
                      {initialOf(kid.fullName)}
                    </span>
                    {kid.fullName.split(" ")[0]}
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
                Todos
              </button>
            </div>
          )}
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

          <div className="flex items-baseline justify-between">
            <div className={labelClass}>FOTOS</div>
            <div className="text-[12px] font-bold text-[#94887B]">
              {photos.length}/10
            </div>
          </div>
          <div
            className={`flex flex-wrap gap-3 ${errors.photos ? "mb-1.5" : ""}`}
          >
            {photos.map((photo, index) => {
              return (
                <div
                  key={photo.previewUrl}
                  className="relative h-[96px] w-[96px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={`Foto ${index + 1} para publicar`}
                    className="h-full w-full rounded-[14px] object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar foto ${index + 1}`}
                    onClick={() => removePhoto(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#ECE0D0] bg-white text-[13px] font-extrabold text-[#D9583C]"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                aria-label="Agregar foto"
                onClick={() => fileInputRef.current?.click()}
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
            )}
          </div>
          {errors.photos && (
            <div className={errorClass}>{errors.photos}</div>
          )}
        </div>
      </div>
    </div>
  );
}
