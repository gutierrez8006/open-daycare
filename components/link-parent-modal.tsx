"use client";

import { useEffect, useState, useTransition } from "react";
import { createInvitation } from "@/app/(staff)/staff/kids/[id]/actions";

type Relationship = "mother" | "father" | "guardian";

type LinkParentForm = {
  name: string;
  email: string;
  relation: Relationship;
};

type LinkParentErrors = {
  name?: string;
  email?: string;
};

const initialForm: LinkParentForm = {
  name: "",
  email: "",
  relation: "mother",
};

const labelClass =
  "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";
const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B] disabled:opacity-60";
const errorClass = "mt-1.5 text-[12px] font-bold text-[#D9583C]";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const relationPills: { value: Relationship; label: string }[] = [
  { value: "mother", label: "Mamá" },
  { value: "father", label: "Papá" },
  { value: "guardian", label: "Tutor/a" },
];

export default function LinkParentModal({
  childId,
  childName,
  onClose,
  onInvited,
}: {
  childId: string;
  childName: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [form, setForm] = useState<LinkParentForm>(initialForm);
  const [errors, setErrors] = useState<LinkParentErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const setField = (field: keyof LinkParentForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError(null);
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as keyof LinkParentErrors];
      return next;
    });
  };

  const handleSend = () => {
    const nextErrors: LinkParentErrors = {};
    if (form.name.trim() === "") {
      nextErrors.name = "Ingresá el nombre del padre/madre";
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Ingresá un email válido";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setServerError(null);
    startTransition(async () => {
      const result = await createInvitation({
        childId,
        fullName: form.name.trim(),
        email: form.email.trim(),
        relationship: form.relation,
      });

      if (!result.ok) {
        setServerError(result.error);
        return;
      }

      setInviteCode(result.code);
      setSentTo(result.email);
      onInvited();
    });
  };

  const isSent = inviteCode !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,.45)] px-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Vincular padre a ${childName}`}
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <div>
            <div className="font-display text-[18px] font-semibold text-[#3F362E]">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {childName}</div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-[26px] py-[22px]">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4E72C8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px flex-none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {childName.split(" ")[0]}.
            </span>
          </div>

          <div className={labelClass}>NOMBRE DEL PADRE/MADRE</div>
          <input
            type="text"
            placeholder="Ej. Diego Fernández"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            disabled={isPending || isSent}
            className={`${inputClass} mb-[18px]`}
          />
          {errors.name && (
            <div className={`${errorClass} mb-[18px]`}>{errors.name}</div>
          )}

          <div className={labelClass}>EMAIL</div>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            disabled={isPending || isSent}
            className={`${inputClass} mb-[18px]`}
          />
          {errors.email && (
            <div className={`${errorClass} mb-[18px]`}>{errors.email}</div>
          )}

          <div className="mb-5">
            <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
              PARENTESCO
            </div>
            <div className="flex gap-[9px]">
              {relationPills.map((pill) => {
                const selected = form.relation === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={isPending || isSent}
                    onClick={() => setField("relation", pill.value)}
                    className={
                      selected
                        ? "flex-1 rounded-full border-[1.5px] border-[#9FB8EC] bg-[#CCD8F4] px-[11px] py-[11px] text-[14px] font-extrabold text-[#4E72C8] disabled:opacity-60"
                        : "flex-1 rounded-full border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-[11px] py-[11px] text-[14px] font-extrabold text-[#6E6359] disabled:opacity-60"
                    }
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`mb-5 rounded-[16px] border-[1.5px] border-dashed p-[18px] text-center ${
              isSent
                ? "border-[#B9DCC4] bg-[#E7F4EB]"
                : "border-[#E6D08A] bg-[#FBF1D6]"
            }`}
          >
            <div
              className={`mb-2 text-[12px] font-extrabold tracking-[.7px] ${
                isSent ? "text-[#3E9B6C]" : "text-[#A88526]"
              }`}
            >
              {isSent ? "CÓDIGO DE INVITACIÓN" : "CÓDIGO DE INVITACIÓN"}
            </div>
            <div
              className={`font-display text-[34px] font-semibold tracking-[7px] ${
                isSent ? "text-[#2F7D55]" : "text-[#B9A469]"
              }`}
            >
              {isSent ? inviteCode : "— — — — —"}
            </div>
            <div
              className={`mt-1.5 text-[13px] ${
                isSent ? "text-[#3E9B6C]" : "text-[#A88526]"
              }`}
            >
              {isSent ? "Vence en 7 días" : "Se genera y envía por email"}
            </div>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-[12px] border border-[#F2C6BD] bg-[#FCE8E4] px-4 py-3 text-[13px] font-bold text-[#B25249]"
            >
              {serverError}
            </div>
          )}

          {isSent ? (
            <div aria-live="polite">
              <div className="mb-4 rounded-[12px] bg-[#E7F4EB] px-4 py-3 text-[13.5px] leading-[1.5] text-[#2F7D55]">
                Invitación enviada a <strong>{sentTo}</strong>. Cuando active su
                cuenta, va a aparecer como padre vinculado.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-[14px] bg-ink py-[14px] text-[15.5px] font-extrabold text-white"
              >
                Listo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-70"
            >
              {isPending ? (
                "Enviando invitación…"
              ) : (
                <>
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m22 2-7 20-4-9-9-4z" />
                    <path d="M22 2 11 13" />
                  </svg>
                  Enviar invitación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
