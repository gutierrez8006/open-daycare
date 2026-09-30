"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivateAccountForm() {
  const router = useRouter();
  const [code, setCode] = useState("7K4P9");
  const [email, setEmail] = useState("lucia.fernandez@gmail.com");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-ink"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        EMAIL
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-muted-strong">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-[#B6A99B]"
      />

      <label
        className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5"
        onClick={() => setAuthorized(!authorized)}
      >
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

      <button
        type="submit"
        className="w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center font-extrabold text-[16px] text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
      >
        Activar mi cuenta
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
