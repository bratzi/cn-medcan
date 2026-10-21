"use client";

import { useId } from "react";

import { ChipFenster } from "@/components/katalog/ChipFenster";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { SORTIER_MEHR, SORTIER_SEGMENT, naechsteSortierung } from "@/lib/katalog/chipleiste";
import { SORTIERUNGEN, aktiveRichtung, type Richtung, type Sortierung, type StrainFilter } from "@/lib/query/filter";

/** Richtungspfeil am aktiven Knopf; die Richtung steht für Screenreader im aria-label. */
function Pfeil({ richtung }: { richtung: Richtung }) {
  return (
    <span aria-hidden="true" className="numeric">
      {richtung === "auf" ? "↑" : "↓"}
    </span>
  );
}

type Props = {
  filter: StrainFilter;
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
export function SortierSegment({ filter, setze, texte, offen, oeffne, schliesse, fussText }: Props) {
  const wert = filter.sortierung;
  const imMenue = SORTIER_MEHR.includes(wert);
  const waehle = (s: Sortierung) => setze(naechsteSortierung(filter, s));
  const richtung = aktiveRichtung(filter);
  return (
    <div role="group" aria-label={texte.sortierung} className={SEGMENT_HUELLE}>
      {SORTIER_SEGMENT.map((s) => {
        const an = wert === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={an}
            aria-label={an ? t(texte.richtungLabel, { name: texte.sortierenKurz[s], richtung: texte.richtung[richtung] }) : undefined}
            onClick={() => waehle(s)}
            className={cn(SEGMENT_KNOPF, "gap-1", an ? SEGMENT_AN : SEGMENT_AUS)}
          >
            {texte.sortierenKurz[s]}
            {an ? <Pfeil richtung={richtung} /> : null}
          </button>
        );
      })}
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
            <>
              {texte.sortierungen[wert]}
              <Pfeil richtung={richtung} />
            </>
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
                aria-label={wert === s ? t(texte.richtungLabel, { name: texte.sortierungen[s], richtung: texte.richtung[richtung] }) : undefined}
                onClick={() => {
                  waehle(s);
                  schliesse();
                }}
                className={cn(MENUE_EINTRAG, "gap-1")}
              >
                {texte.sortierungen[s]}
                {wert === s ? <Pfeil richtung={richtung} /> : null}
              </button>
            </li>
          ))}
        </ul>
      </ChipFenster>
    </div>
  );
}

/** Sortierung unter lg als eigener Chip mit Sheet, Radioliste aller Sortierungen. */
export function SortierChip({ filter, setze, texte, offen, oeffne, schliesse, fussText }: Props) {
  const name = useId();
  const wert = filter.sortierung;
  const richtung = aktiveRichtung(filter);
  return (
    <ChipFenster
      titel={texte.sortierung}
      zahl={0}
      offen={offen}
      oeffne={oeffne}
      schliesse={schliesse}
      fussText={fussText}
      knopfText={
        <>
          {texte.sortierungen[wert]}
          <Pfeil richtung={richtung} />
        </>
      }
    >
      {/* Mobil dreht ein eigener Knopf die Richtung (die Radios wählen nur die Sortierung). */}
      <button
        type="button"
        onClick={() => setze(naechsteSortierung(filter, wert))}
        className={cn(SEGMENT_KNOPF, "mb-2 gap-1 border border-border-strong", SEGMENT_AUS)}
      >
        {t(texte.richtungDrehen, { richtung: texte.richtung[richtung] })}
        <Pfeil richtung={richtung} />
      </button>
      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="sr-only">{texte.sortierung}</legend>
        {SORTIERUNGEN.map((s) => (
          <label key={s} className="flex min-h-11 cursor-pointer items-center gap-2 text-small text-text">
            <input
              type="radio"
              name={name}
              checked={wert === s}
              onChange={() => setze(naechsteSortierung(filter, s))}
              className="size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            />
            {texte.sortierungen[s]}
          </label>
        ))}
      </fieldset>
    </ChipFenster>
  );
}
