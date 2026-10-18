"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/login/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction}>
      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        EMAIL
      </div>
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        disabled={pending}
        defaultValue="caro@opendaycare.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B]"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CONTRASEÑA
      </div>
      <input
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="current-password"
        disabled={pending}
        placeholder="••••••••"
        className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B]"
      />

      <div className="mb-5 text-right">
        <a
          href="#"
          className="text-[13.5px] font-bold text-[#C5503A]"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mb-3 rounded-[10px] border border-[#E0B4A6] bg-[#FCECE6] px-3 py-2 text-[13.5px] text-[#B0412A]"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center font-extrabold text-[16px] text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
