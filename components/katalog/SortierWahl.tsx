"use client";

import { useId } from "react";

import { ChipFenster } from "@/components/katalog/ChipFenster";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { SORTIER_MEHR, SORTIER_SEGMENT } from "@/lib/katalog/chipleiste";
import { SORTIERUNGEN, type Sortierung, type StrainFilter } from "@/lib/query/filter";

type Props = {
  wert: Sortierung;
  setze: (teil: Partial<StrainFilter>) => void;
  texte: Woerterbuch["katalog"]["leiste"];
  offen: boolean;
  oeffne: () => void;
  schliesse: () => void;
  fussText: string;
};

/** Segment-Knopf: h-11 = 44 px Touch-Ziel, gefüllt nur der aktive (eine Primärfläche je Gruppe). */
export const SEGMENT_KNOPF =
  "inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-small transition-colors duration-fast ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed";
export const SEGMENT_AN = "bg-accent text-accent-fg";
export const SEGMENT_AUS = "text-text hover:bg-surface-sunken";
/** Gemeinsame Fläche der Segmente (Law of Common Region): eine Pille um alle Knöpfe. */
export const SEGMENT_HUELLE = "flex items-center gap-1 rounded-full border border-border-strong bg-surface p-1";

const MENUE_EINTRAG =
  "flex min-h-11 w-full items-center rounded-md px-2 text-start text-small text-text hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-pressed:font-medium aria-pressed:text-accent";

/**
 * Sortierung ab lg als Segment (Spec 2026-10-21): vier häufige direkt (Hick), der Rest im „…“-Menü.
 * Ist die aktive Sortierung im Menü, trägt „…“ den gedrückten Zustand und zeigt ihr Label.
 */
export function SortierSegment({ wert, setze, texte, offen, oeffne, schliesse, fussText }: Props) {
  const imMenue = SORTIER_MEHR.includes(wert);
  const waehle = (s: Sortierung) => setze({ sortierung: s, seite: 1 });
  return (
    <div role="group" aria-label={texte.sortierung} className={SEGMENT_HUELLE}>
      {SORTIER_SEGMENT.map((s) => (
        <button key={s} type="button" aria-pressed={wert === s} onClick={() => waehle(s)} className={cn(SEGMENT_KNOPF, wert === s ? SEGMENT_AN : SEGMENT_AUS)}>
          {texte.sortierenKurz[s]}
        </button>
      ))}
      <ChipFenster
        titel={texte.weitereSortierung}
        zahl={0}
        offen={offen}
        oeffne={oeffne}
        schliesse={schliesse}
        fussText={fussText}
        gedrueckt={imMenue}
        knopfText={
          imMenue ? (
            texte.sortierungen[wert]
          ) : (
            <>
              <span aria-hidden="true">…</span>
              <span className="sr-only">{texte.weitereSortierung}</span>
            </>
          )
        }
      >
        <ul className="flex flex-col gap-1">
          {SORTIER_MEHR.map((s) => (
            <li key={s}>
              <button
                type="button"
                aria-pressed={wert === s}
                onClick={() => {
                  waehle(s);
                  schliesse();
                }}
                className={MENUE_EINTRAG}
              >
                {texte.sortierungen[s]}
              </button>
            </li>
          ))}
        </ul>
      </ChipFenster>
    </div>
  );
}

/** Sortierung unter lg als eigener Chip mit Sheet, Radioliste aller Sortierungen. */
export function SortierChip({ wert, setze, texte, offen, oeffne, schliesse, fussText }: Props) {
  const name = useId();
  return (
    <ChipFenster titel={texte.sortierung} zahl={0} offen={offen} oeffne={oeffne} schliesse={schliesse} fussText={fussText} knopfText={texte.sortierungen[wert]}>
      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="sr-only">{texte.sortierung}</legend>
        {SORTIERUNGEN.map((s) => (
          <label key={s} className="flex min-h-11 cursor-pointer items-center gap-2 text-small text-text">
            <input
              type="radio"
              name={name}
              checked={wert === s}
              onChange={() => setze({ sortierung: s, seite: 1 })}
              className="size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            />
            {texte.sortierungen[s]}
          </label>
        ))}
      </fieldset>
    </ChipFenster>
  );
}
