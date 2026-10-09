import type { ReactNode } from "react";

import { FeldKopf, type FeldKopfTexte } from "@/components/kapitel/FeldKopf";
import { cn } from "@/lib/cn";

export type FeldSpalten = 3 | 4 | 5 | 6 | 10;

/** Feste Klassen je Breite: Tailwind findet nur ausgeschriebene Namen. */
export const FELD_SPALTEN: Record<FeldSpalten, string> = {
  3: "min-[1080px]:col-span-3",
  4: "min-[1080px]:col-span-4",
  5: "min-[1080px]:col-span-5",
  6: "min-[1080px]:col-span-6",
  10: "min-[1080px]:col-span-10",
};

type Props = {
  id: string;
  titel: string;
  satz?: string;
  spalten: FeldSpalten;
  /** Kopf im Stil der Startseite (Nutzer 2026-10-09); ohne bleibt die schlichte Überschrift aus `titel`. */
  kopf?: FeldKopfTexte;
  /** Farbe des Schlagworts; Grün und Lila wechseln von Feld zu Feld. */
  ton?: "gruen" | "lila";
  /** Nur „Umfrage jetzt“: der Stimmzettel liegt als Ebene auf dem Buch (Regel 5). */
  stimmzettel?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * Ein Feld statt einer Karte (Spec 4): eckige Fläche, die das Raster unter
 * sich abdeckt, links die Rasterlinie als Kante, oben der Kapitelstrich.
 * Unter 1080 px über alle 4 Spalten.
 */
export function Feld({ id, titel, satz, spalten, kopf, ton, stimmzettel = false, className, children }: Props) {
  return (
    <section
      data-feld=""
      aria-labelledby={`${id}-titel`}
      className={cn(
        "col-span-4 flex min-w-0 flex-col gap-6 border-t border-l border-t-border-strong border-l-border p-6 min-[1080px]:p-8",
        FELD_SPALTEN[spalten],
        kopf && "relative isolate overflow-x-clip",
        // cn mischt nicht (ohne tailwind-merge): der Grund steht je Zustand genau einmal.
        stimmzettel ? "bg-surface-raised shadow-md" : "bg-surface",
        className,
      )}
    >
      {kopf ? (
        <div className="flex flex-col items-center gap-2 pt-8">
          <FeldKopf id={`${id}-titel`} texte={kopf} ton={ton} />
          {satz ? <p className="mx-auto max-w-[68ch] text-center text-small text-text-muted text-pretty">{satz}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 id={`${id}-titel`} className="text-h3 text-text text-balance">
            {titel}
          </h2>
          {satz ? <p className="max-w-[68ch] text-small text-text-muted text-pretty">{satz}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
