/**
 * Mi cuenta del panel familia (placeholder mínimo, SPEC role-based-panel-access).
 * El contenido real (datos de la familia, vinculación con niños) es otro change.
 */
export default function FamiliaCuentaPage({}: PageProps<"/familia/cuenta">) {
  return (
    <div className="max-w-[720px] w-full mx-auto px-6 lg:px-10 py-9 pb-20">
      <div className="mb-5">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.08em] text-[#D9583C]">
          MI CUENTA
        </div>
        <h1 className="font-display text-[30px] font-semibold text-[#3F362E]">
          Mi cuenta
        </h1>
      </div>

      <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#ECE0D0] bg-[#FFFDF9] px-6 py-16 text-center">
        <p className="max-w-[380px] text-[14.5px] leading-relaxed text-[#94887B]">
          Los datos y la configuración de tu cuenta estarán disponibles próximamente.
        </p>
      </div>
    </div>
  );
}
