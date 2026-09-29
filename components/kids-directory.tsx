"use client";

import { useMemo, useState } from "react";
import { children } from "@/data/children";
import KidCard from "@/components/kid-card";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function KidsDirectory() {
  const [query, setQuery] = useState("");

  const filteredChildren = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return children;
    return children.filter((child) => normalize(child.name).includes(normalizedQuery));
  }, [query]);

  return (
    <>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-card px-4 py-3">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="min-w-0 flex-1 border-none bg-none text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </div>

      <div className="mb-[14px] flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
          SALA SOLES
        </span>
        <span className="text-[13px] text-muted">{children.length} niños</span>
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>

      {filteredChildren.length === 0 ? (
        <p className="py-8 text-center text-[14.5px] text-muted">
          No encontramos niños con ese nombre.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {filteredChildren.map((child) => (
            <KidCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
