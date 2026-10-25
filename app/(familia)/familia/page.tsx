import { getCurrentDaycare } from "@/utils/current-daycare";

/**
 * Feed del panel familia (placeholder mínimo, SPEC role-based-panel-access).
 * El contenido real (publicaciones filtradas por hijos vinculados) es otro change.
 */
export default async function FamiliaFeedPage({}: PageProps<"/familia">) {
  const daycare = await getCurrentDaycare();

  return (
    <div className="max-w-[720px] w-full mx-auto px-6 lg:px-10 py-9 pb-20">
      <div className="mb-5">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.08em] text-[#D9583C]">
          TU FAMILIA
        </div>
        <h1 className="font-display text-[30px] font-semibold text-[#3F362E]">
          Feed familiar
        </h1>
        {daycare ? (
          <p className="mt-1.5 text-[14.5px] text-[#94887B]">{daycare.name}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#ECE0D0] bg-[#FFFDF9] px-6 py-16 text-center">
        <p className="max-w-[380px] text-[14.5px] leading-relaxed text-[#94887B]">
          El feed de publicaciones de tu familia estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}
