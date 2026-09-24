import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";

/** Titelblatt der Produktseite (Spec TP2 3.9): Name, Zeile, Note. */
export function TitelblattSkelett() {
  return (
    <div
      role="status"
      className="grid grid-cols-1 gap-8 border-b-2 border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
    >
      <SkelettAnsage text="Produkt wird geladen" />
      <div aria-hidden="true" className="flex flex-col gap-4">
        <span className={`${SKELETT_FLAECHE} h-16 w-3/4`} />
        <span className={`${SKELETT_FLAECHE} h-6 w-1/3`} />
        <span className={`${SKELETT_FLAECHE} h-8 w-1/2`} />
      </div>
      <span aria-hidden="true" className={`${SKELETT_FLAECHE} h-20 w-40`} />
    </div>
  );
}
