"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createKid } from "@/app/(staff)/staff/kids/actions";

export type AddKidRoom = {
  id: string;
  name: string;
};

const labelClass = "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";
const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";
const errorClass = "mt-1.5 text-[12px] font-bold text-[#D9583C]";

const BIRTH_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

const birthDateError = (value: string): string | null => {
  if (!BIRTH_DATE_PATTERN.test(value)) {
    return "Usa una fecha válida (dd/mm/aaaa)";
  }
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const isRealCalendarDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  if (!isRealCalendarDate) {
    return "Usa una fecha válida (dd/mm/aaaa)";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() > today.getTime()) {
    return "La fecha de nacimiento no puede ser futura";
  }
  return null;
};

type AddKidForm = {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergies: string;
  medicalNotes: string;
};

type AddKidErrors = {
  fullName?: string;
  birthDate?: string;
};

const buildInitialForm = (rooms: AddKidRoom[]): AddKidForm => ({
  fullName: "",
  birthDate: "",
  roomId: rooms[0]?.id ?? "",
  allergies: "",
  medicalNotes: "",
});

export default function AddKidModal({ rooms }: { rooms: AddKidRoom[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddKidForm>(() => buildInitialForm(rooms));
  const [errors, setErrors] = useState<AddKidErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField = (field: keyof AddKidForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as keyof AddKidErrors];
      return next;
    });
  };

  const closeModal = useCallback(() => {
    setOpen(false);
    setErrors({});
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeModal]);

  const handleSave = () => {
    const nextErrors: AddKidErrors = {};
    if (form.fullName.trim() === "") {
      nextErrors.fullName = "Ingresa el nombre completo";
    }
    const dateError = birthDateError(form.birthDate);
    if (dateError) {
      nextErrors.birthDate = dateError;
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const result = await createKid({
        fullName: form.fullName,
        birthDate: form.birthDate,
        roomId: form.roomId,
        allergies: form.allergies,
        medicalNotes: form.medicalNotes,
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setOpen(false);
      setForm(buildInitialForm(rooms));
      setErrors({});
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
      >
        <PlusIcon />
        Agregar niño
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,.45)] px-4 py-10"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-label="Agregar niño"
            className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <button
                type="button"
                onClick={closeModal}
                className="text-[15px] font-bold text-[#94887B]"
              >
                Cancelar
              </button>
              <span className="font-display text-[18px] font-semibold text-[#3F362E]">
                Agregar niño
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="text-[15px] font-extrabold text-[#D9583C] disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
            <div className="px-[26px] py-6">
              {formError && (
                <div
                  role="alert"
                  className="mb-[18px] rounded-[14px] border border-[#F0C4B8] bg-[#FBE3DB] px-4 py-3 text-[13px] font-bold text-[#D9583C]"
                >
                  {formError}
                </div>
              )}
              <div className="mb-[18px]">
                <div className={labelClass}>NOMBRE COMPLETO</div>
                <input
                  type="text"
                  placeholder="Ej. Martina López"
                  value={form.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  autoFocus
                  className={inputClass}
                />
                {errors.fullName && <div className={errorClass}>{errors.fullName}</div>}
              </div>

              <div className="mb-[18px] flex gap-[14px]">
                <div className="min-w-0 flex-1">
                  <div className={labelClass}>FECHA DE NACIMIENTO</div>
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={form.birthDate}
                    onChange={(event) => setField("birthDate", event.target.value)}
                    aria-invalid={Boolean(errors.birthDate)}
                    className={inputClass}
                  />
                  {errors.birthDate && <div className={errorClass}>{errors.birthDate}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={labelClass}>SALA</div>
                  <div className="relative">
                    <select
                      aria-label="Sala"
                      value={form.roomId}
                      onChange={(event) => setField("roomId", event.target.value)}
                      className={`${inputClass} appearance-none pr-10 font-bold`}
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B0A290"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-[18px]">
                <div className={labelClass}>ALERGIAS (ETIQUETAS)</div>
                <input
                  type="text"
                  placeholder="Ej. Maní, Lactosa"
                  value={form.allergies}
                  onChange={(event) => setField("allergies", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <div className={labelClass}>NOTAS MÉDICAS</div>
                <textarea
                  placeholder="Indicaciones, medicación, contactos…"
                  value={form.medicalNotes}
                  onChange={(event) => setField("medicalNotes", event.target.value)}
                  className={`${inputClass} min-h-[90px] resize-y leading-[1.5]`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
