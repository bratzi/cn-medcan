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
  /** Breite im Feldbuch-Raster; ohne bestimmt das Raster der umgebenden Ansicht die Breite (className). */
  spalten?: FeldSpalten;
  /** `klein` in den Reitern des Profils: Überschrift in text-h2 statt text-display. */
  groesse?: "gross" | "klein";
  /** `raster` = Kanten im Feldbuch-Raster; `karte` = eckiger Rahmen ringsum (Reiter im Profil). */
  rahmen?: "raster" | "karte";
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
export function Feld({ id, titel, satz, spalten, groesse = "gross", rahmen = "raster", kopf, ton, stimmzettel = false, className, children }: Props) {
  return (
    <section
      data-feld=""
      aria-labelledby={`${id}-titel`}
      className={cn(
        "flex min-w-0 flex-col gap-6 p-6 min-[1080px]:p-8",
        rahmen === "karte" ? "rounded-lg border border-border" : "border-t border-l border-t-border-strong border-l-border",
        spalten ? `col-span-4 ${FELD_SPALTEN[spalten]}` : null,
        // cn mischt nicht (ohne tailwind-merge): der Grund steht je Zustand genau einmal.
        stimmzettel ? "bg-surface-raised shadow-md" : "bg-surface",
        className,
      )}
    >
      {kopf ? (
        <div className="flex flex-col items-center gap-2">
          <FeldKopf id={`${id}-titel`} texte={kopf} ton={ton} groesse={groesse} />
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
