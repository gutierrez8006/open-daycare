"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("caro@opendaycare.com");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        EMAIL
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B]"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CONTRASEÑA
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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

      <button
        type="submit"
        className="w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center font-extrabold text-[16px] text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
