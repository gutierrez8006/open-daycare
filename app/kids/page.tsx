import KidsDirectory from "@/components/kids-directory";

export default function KidsPage() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-brand">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <a
          href="#"
          className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        >
          <PlusIcon />
          Agregar niño
        </a>
      </div>

      <KidsDirectory />
    </div>
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
