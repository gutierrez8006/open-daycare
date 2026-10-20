"use client";

import { useActionState, useState } from "react";
import {
  activateAccountAction,
  type ActivateState,
} from "@/app/(auth)/activate-account/actions";

export default function ActivateAccountForm({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ActivateState, FormData>(
    activateAccountAction,
    {},
  );
  const [authorized, setAuthorized] = useState(true);

  return (
    <form action={formAction}>
      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        type="text"
        name="code"
        value={code}
        readOnly
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-ink"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        defaultValue={email}
        disabled={pending}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink disabled:opacity-60"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="••••••••"
        disabled={pending}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B] disabled:opacity-60"
      />

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <input
          type="checkbox"
          name="authorized"
          checked={authorized}
          onChange={(event) => setAuthorized(event.target.checked)}
          disabled={pending}
          className="sr-only"
        />
        <span
          className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[8px]"
          style={{ background: authorized ? "#5FB97E" : "#D4C89A" }}
        >
          {authorized && <CheckIcon />}
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
          la app.
        </span>
      </label>

      {state?.error && (
        <div
          role="alert"
          className="mb-4 rounded-[10px] border border-[#E0B4A6] bg-[#FCECE6] px-3 py-2 text-[13.5px] text-[#B0412A]"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center font-extrabold text-[16px] text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Activando…" : "Activar mi cuenta"}
      </button>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
