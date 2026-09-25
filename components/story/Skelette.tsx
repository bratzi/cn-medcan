/**
 * Skelette der Datensektionen (Spec 5.2): sie zeigen die Form, die gleich
 * kommt, statt eines Spinners. `data-skelett` braucht die StoryBuehne: die
 * Scroll-Abläufe starten erst, wenn kein Skelett mehr steht, sonst messen
 * sie eine Seite, die sich noch verschiebt.
 */
export const SKELETT_FLAECHE = "block bg-surface-raised motion-safe:animate-pulse";

export function SkelettAnsage({ text }: { text: string }) {
  return <span className="sr-only">{text}</span>;
}

export function RandspaltenSkelett() {
  return (
    <div role="status" data-skelett="" className="flex flex-col gap-8">
      <SkelettAnsage text="Zahlen werden geladen" />
      {["w-48", "w-56", "w-40"].map((breite) => (
        <span key={breite} aria-hidden="true" className={`${SKELETT_FLAECHE} h-12 ${breite}`} />
      ))}
    </div>
  );
}

export function DoppelseitenSkelett() {
  return (
    <div role="status" data-skelett="" className="grid grid-cols-1 border border-border lg:grid-cols-2">
      <SkelettAnsage text="Eintrag wird geladen" />
      <div aria-hidden="true" className="flex flex-col gap-6 p-6 sm:p-12">
        <span className={`${SKELETT_FLAECHE} h-4 w-40`} />
        <span className={`${SKELETT_FLAECHE} h-16 w-3/4`} />
        <span className={`${SKELETT_FLAECHE} h-40 w-full`} />
      </div>
      <div aria-hidden="true" className="p-6 sm:p-12">
        <span className={`${SKELETT_FLAECHE} aspect-square w-full max-w-sm`} />
      </div>
    </div>
  );
}

/** Auf dem Blatt des Stimmzettels (surface-raised) braucht das Skelett die tiefere Fläche. */
const SKELETT_AUF_BLATT = "block bg-surface-sunken motion-safe:animate-pulse";

export function StimmzettelSkelett() {
  return (
    <div role="status" data-skelett="" className="border border-border-strong bg-surface-raised shadow-md">
      <SkelettAnsage text="Abstimmung wird geladen" />
      <div aria-hidden="true" className="border-b border-border px-6 py-4">
        <span className={`${SKELETT_AUF_BLATT} h-6 w-32 rounded-full`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6 px-6 py-6">
        <span className={`${SKELETT_AUF_BLATT} h-8 w-2/3`} />
        {["w-3/4", "w-1/2", "w-2/3"].map((breite) => (
          <span key={breite} className={`${SKELETT_AUF_BLATT} h-6 ${breite}`} />
        ))}
      </div>
    </div>
  );
}

export function KatalogSkelett() {
  return (
    <div role="status" data-skelett="" className="flex gap-4 overflow-hidden">
      <SkelettAnsage text="Blüten werden geladen" />
      {[0, 1, 2].map((stelle) => (
        <span key={stelle} aria-hidden="true" className={`${SKELETT_FLAECHE} h-96 w-72 shrink-0`} />
      ))}
    </div>
  );
}
