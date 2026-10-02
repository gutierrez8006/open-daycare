"use client";

import { useState } from "react";
import { children } from "@/data/children";

const rooms = [...new Set(children.map((child) => child.room))];

const labelClass = "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";
const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";

export default function AddKidModal() {
  const [open, setOpen] = useState(false);

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
          onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
                className="text-[15px] font-bold text-[#94887B]"
              >
                Cancelar
              </button>
              <span className="font-display text-[18px] font-semibold text-[#3F362E]">
                Agregar niño
              </span>
              <button
                type="button"
                className="text-[15px] font-extrabold text-[#D9583C]"
              >
                Guardar
              </button>
            </div>
            <div className="px-[26px] py-6">
              <div className="mb-[18px]">
                <div className={labelClass}>NOMBRE COMPLETO</div>
                <input type="text" placeholder="Ej. Martina López" className={inputClass} />
              </div>

              <div className="mb-[18px] flex gap-[14px]">
                <div className="min-w-0 flex-1">
                  <div className={labelClass}>FECHA DE NACIMIENTO</div>
                  <input type="text" placeholder="dd/mm/aaaa" className={inputClass} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={labelClass}>SALA</div>
                  <div className="relative">
                    <select
                      aria-label="Sala"
                      defaultValue="Soles"
                      className={`${inputClass} appearance-none pr-10 font-bold`}
                    >
                      {rooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
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
                  className={inputClass}
                />
              </div>

              <div>
                <div className={labelClass}>NOTAS MÉDICAS</div>
                <textarea
                  placeholder="Indicaciones, medicación, contactos…"
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
