"use client";

import { SortierWahl } from "@/components/katalog/SortierWahl";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { StrainFilter } from "@/lib/query/filter";

type Props = {
  filter: StrainFilter;
  /** Zahl aktiver Filter für das Badge am Knopf. */
  aktiv: number;
  /** Wirksamer Zustand der Filterspalte (für aria-expanded); sichtbar macht sie das CSS. */
  filterOffen: boolean;
  /** id der Filterspalte für aria-controls. */
  filterId: string;
  umschalten: () => void;
  setze: (teil: Partial<StrainFilter>) => void;
  deaktiviert: boolean;
  trefferText: string;
  texte: Woerterbuch["katalog"];
};

/**
 * Werkzeugleiste über dem Raster (Task 2, 2026-10-20). Ab lg eine Zeile: Filter-Knopf (blendet die
 * Spalte direkt darunter ein und aus), Ansicht Blüten oder Handelsnamen, Trefferzahl, rechts die
 * Sortierung. Mobil bleiben Ansicht und Trefferzahl wie bisher, Filter und Sortierung sitzen dort in
 * der MobilLeiste. Gruppen per Abstand (Law of Proximity): 8 px in der Ansicht, 24 px dazwischen.
 * Den offenen Zustand zeigt der Knopf über `.katalog-filterknopf` (globals.css) aus derselben Quelle
 * wie die Spalte, deshalb ohne Farbwechsel bei der Hydration.
 */
export function Werkzeugleiste({ filter, aktiv, filterOffen, filterId, umschalten, setze, deaktiviert, trefferText, texte }: Props) {
  return (
    <div data-werkzeugleiste className="flex flex-wrap items-center gap-6">
      <button
        type="button"
        aria-expanded={filterOffen}
        aria-controls={filterId}
        onClick={umschalten}
        className="katalog-filterknopf hidden h-11 shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-small text-text transition-[border-color,scale] duration-fast ease-standard hover:border-accent-hover active:scale-[0.97] lg:inline-flex"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
        {texte.leiste.filterKnopf}
        {aktiv > 0 ? (
          <span className="numeric flex size-6 items-center justify-center rounded-full bg-accent text-caption text-accent-fg">{aktiv}</span>
        ) : null}
      </button>

      <nav aria-label={texte.ansicht.titel}>
        <ul className="flex flex-wrap gap-2">
          {(["bluete", "ware"] as const).map((ansicht) => {
            const an = filter.ansicht === ansicht;
            return (
              <li key={ansicht}>
                <button
                  type="button"
                  aria-pressed={an}
                  disabled={deaktiviert}
                  onClick={() => setze({ ansicht })}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-fast ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed",
                    an ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-raised text-text hover:border-accent-hover",
                  )}
                >
                  {ansicht === "ware" ? texte.ansicht.ware : texte.ansicht.bluete}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <p aria-live="polite" className="numeric basis-full text-small text-text-muted lg:basis-auto">
        {trefferText}
      </p>

      <div className="hidden items-center gap-2 lg:ms-auto lg:flex">
        <SortierWahl wert={filter.sortierung} setze={setze} texte={texte.leiste} />
      </div>
    </div>
  );
}
