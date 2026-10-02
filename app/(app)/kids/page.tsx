import AddKidModal from "@/components/add-kid-modal";
import KidsDirectory from "@/components/kids-directory";

export default function KidsPage() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px] [line-height:normal]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-brand">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <AddKidModal />
      </div>

      <KidsDirectory />
    </div>
  );
}
