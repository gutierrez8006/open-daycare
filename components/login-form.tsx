"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        required
        defaultValue="caro@opendaycare.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B]"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        required
        minLength={6}
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

      {state.error && (
        <p
          role="alert"
          className="mb-3 text-[13.5px] font-semibold text-[#C5503A]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center font-extrabold text-[16px] text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-70"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
