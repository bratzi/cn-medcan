"use client";

import { useState } from "react";

import { ChipFenster } from "@/components/katalog/ChipFenster";
import { FilterFeld, type FeldProps } from "@/components/katalog/FilterFelder";
import { SEGMENT_AN, SEGMENT_AUS, SEGMENT_HUELLE, SEGMENT_KNOPF, SortierChip, SortierSegment } from "@/components/katalog/SortierWahl";
import { cn } from "@/lib/cn";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { chipZahl, sichtbareChips, type ChipSchluessel } from "@/lib/katalog/chipleiste";
import type { StrainFilter } from "@/lib/query/filter";

/** Ein gesetzter Filter in der Aktiv-Zeile; `ohne` entfernt ihn. */
export type AktiverChip = { schluessel: string; text: string; ohne: Partial<StrainFilter> };

type Props = Omit<FeldProps, "texte"> & {
  texte: Woerterbuch["katalog"];
  trefferText: string;
  /** Trefferzahl für den Ergebnisknopf im Sheet. */
  gesamt: number;
  aktiveChips: AktiverChip[];
  zuruecksetzen: () => void;
};

/** Offenes Fenster: ein Chip, das Sortier-Menü (ab lg) oder der Sortier-Chip (mobil). Nie zwei zugleich. */
type Offen = ChipSchluessel | "sortierMehr" | "sortierung" | null;

/** Trefferzahl: die führende Zahl im Handschrift-Akzent, das Wort gedruckt (Akzent aufs kurze Element). */
function Treffer({ text }: { text: string }) {
  const teil = /^(\d[\d.,\s]*?)(\s.*)$/.exec(text);
  return (
    <p aria-live="polite" className="text-small text-text-muted">
      {teil ? (
        <>
          <span className="font-hand text-vermerk text-accent">{teil[1]}</span>
          {teil[2]}
        </>
      ) : (
        text
      )}
    </p>
  );
}

/**
 * Werkzeugleiste der Blütenseite (Spec 2026-10-21), sticky unter dem Seitenkopf.
 * Zeile 1: Ansicht als Segment, Trefferzahl, rechts ab lg das Sortier-Segment (mobil ein Chip).
 * Zeile 2: Chipleiste, mobil waagerecht scrollbar, ab lg umbrechend; jeder Chip öffnet sein Fenster.
 * Zeile 3: gesetzte Filter als entfernbare Chips mit „Zurücksetzen“, rechts die Kurzlegende.
 */
export function Werkzeugleiste({ texte, trefferText, gesamt, aktiveChips, zuruecksetzen, ...feld }: Props) {
  const { filter, setze, deaktiviert, sprache, daten } = feld;
  const [offen, setOffen] = useState<Offen>(null);
  const fussText = mehrzahl(sprache, texte.leiste.trefferZeigen, gesamt);
  const steuerung = (schluessel: Exclude<Offen, null>) => ({
    offen: offen === schluessel,
    oeffne: () => setOffen(schluessel),
    // Nur das eigene Fenster schließen: ein anderer Chip kann schon geöffnet haben.
    schliesse: () => setOffen((alt) => (alt === schluessel ? null : alt)),
    fussText,
  });

  return (
    <div data-werkzeugleiste className="sticky top-(--kopf-h,4rem) z-20 flex flex-col gap-3 border-b border-border bg-surface py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <nav aria-label={texte.ansicht.titel}>
          <ul className={SEGMENT_HUELLE}>
            {(["bluete", "ware"] as const).map((ansicht) => {
              const an = filter.ansicht === ansicht;
              return (
                <li key={ansicht}>
                  <button type="button" aria-pressed={an} disabled={deaktiviert} onClick={() => setze({ ansicht })} className={cn(SEGMENT_KNOPF, an ? SEGMENT_AN : SEGMENT_AUS)}>
                    {ansicht === "ware" ? texte.ansicht.ware : texte.ansicht.bluete}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Treffer text={trefferText} />

        <div className="ms-auto lg:hidden">
          <SortierChip filter={filter} setze={setze} texte={texte.leiste} {...steuerung("sortierung")} />
        </div>
        <div className="ms-auto hidden lg:block">
          <SortierSegment filter={filter} setze={setze} texte={texte.leiste} {...steuerung("sortierMehr")} />
        </div>
      </div>

      <div
        data-chipleiste
        role="group"
        aria-label={texte.filter}
        className="flex min-w-0 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain lg:flex-wrap lg:overflow-visible"
      >
        {sichtbareChips(daten?.fachkreis ?? false).map((chip) => (
          <ChipFenster key={chip} titel={texte.leiste.chips[chip]} zahl={chipZahl(filter, chip)} {...steuerung(chip)}>
            <FilterFeld chip={chip} {...feld} texte={texte.leiste} />
          </ChipFenster>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {aktiveChips.length > 0 ? (
          <div className="flex flex-col">
            <h2 className="sr-only">{texte.aktiv.titel}</h2>
            <ul className="flex flex-wrap items-center gap-2">
              {aktiveChips.map((chip) => (
                <li key={chip.schluessel}>
                  <button
                    type="button"
                    disabled={deaktiviert}
                    onClick={() => setze(chip.ohne)}
                    aria-label={t(texte.aktiv.entfernen, { wert: chip.text })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-small text-text hover:border-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed"
                  >
                    {chip.text}
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  disabled={deaktiviert}
                  onClick={zuruecksetzen}
                  className="min-h-11 px-2 text-small text-accent underline underline-offset-4 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed"
                >
                  {texte.zuruecksetzen}
                </button>
              </li>
            </ul>
          </div>
        ) : null}
        <p data-legende className="text-caption text-text-muted lg:ms-auto">{texte.leiste.legendeKurz}</p>
      </div>
    </div>
  );
}
