"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type Fuellung = "voll" | "halb" | "leer";

const BLAETTER = [1, 2, 3, 4, 5] as const;

/** Je Blatt: voll ab der ganzen Stufe, halb ab der halben, sonst leer. */
export function blattFuellungen(note: number | null): Fuellung[] {
  return BLAETTER.map((blatt) => (note === null || note < blatt - 0.5 ? "leer" : note >= blatt ? "voll" : "halb"));
}

/** Ein halbes Blatt mehr (+1) oder weniger (-1), in den Grenzen 0,5 bis 5; ohne Note beginnt Plus bei 0,5. */
export function halbSchritt(note: number | null, richtung: 1 | -1): number | null {
  if (note === null) return richtung === 1 ? 0.5 : null;
  return Math.min(5, Math.max(0.5, note + richtung * 0.5));
}

/** Minus/Plus nur bei grobem Zeiger (Touch): 44 × 44 px, Pille wie die Knöpfe. */
const STUFEN_KNOPF =
  "hidden size-11 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-h3 text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken aria-disabled:opacity-50 pointer-coarse:inline-flex";

/*
 * Fächerblatt mit sieben Fingern im 24er-Raster, spiegelgleich zur Mittelachse
 * x = 12. Die zwei Hälften sind eigene Flächen (der Mittelfinger längs geteilt),
 * so füllt sich ein halbes Blatt ohne clipPath und ohne ids im Dokument.
 */
const KONTUR =
  "M12 16.5Q9 9 12 1.5Q15 9 12 16.5ZM12 16.5Q10.4 9.9 4.7 6.4Q6.2 13 12 16.5ZM12 16.5Q8 12.5 2.3 12.6Q6.3 16.6 12 16.5ZM12 16.5Q8.7 15.8 6.2 18.2Q9.6 18.9 12 16.5ZM12 16.5Q17.8 13 19.3 6.4Q13.6 9.9 12 16.5ZM12 16.5Q17.7 16.6 21.7 12.6Q16 12.5 12 16.5ZM12 16.5Q14.4 18.9 17.8 18.2Q15.3 15.8 12 16.5Z";
const LINKS =
  "M12 16.5Q9 9 12 1.5ZM12 16.5Q10.4 9.9 4.7 6.4Q6.2 13 12 16.5ZM12 16.5Q8 12.5 2.3 12.6Q6.3 16.6 12 16.5ZM12 16.5Q8.7 15.8 6.2 18.2Q9.6 18.9 12 16.5Z";
const RECHTS =
  "M12 16.5Q15 9 12 1.5ZM12 16.5Q17.8 13 19.3 6.4Q13.6 9.9 12 16.5ZM12 16.5Q17.7 16.6 21.7 12.6Q16 12.5 12 16.5ZM12 16.5Q14.4 18.9 17.8 18.2Q15.3 15.8 12 16.5Z";

/**
 * Ein Blatt, rein dekorativ: gefüllt in `accent`, leer nur die Kontur. Die
 * Vorschau unter dem Zeiger füllt in `accent-hover` (Hover über das eigene
 * Token, nicht über Deckkraft). Bewegung nur Farbe und Deckkraft, kurz; bei
 * reduzierter Bewegung (globale Regel) und im Sparmodus (globals.css,
 * `.blatt-note`) wechselt der Zustand sofort.
 */
function BlattGlyphe({ fuellung, vorschau }: { fuellung: Fuellung; vorschau: boolean }) {
  const flaeche = (an: boolean) =>
    cn(
      "transition-[fill,opacity] duration-fast ease-standard",
      vorschau ? "fill-accent-hover" : "fill-accent",
      an ? "opacity-100" : "opacity-0",
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-full text-accent">
      <path d={LINKS} className={flaeche(fuellung !== "leer")} />
      <path d={RECHTS} className={flaeche(fuellung === "voll")} />
      <path d={KONTUR} fill="none" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
      <path d="M12 16.5v5.5" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

export type BlattNoteTexte = Pick<
  Woerterbuch["bewerten"],
  | "gesamtnote"
  | "gesamtnoteHinweis"
  | "gesamtnoteHinweisTouch"
  | "blattWert"
  | "keineNote"
  | "halbWeniger"
  | "halbMehr"
  | "noteEntfernen"
>;

/**
 * Gesamtnote mit fünf Cannabisblättern (Masterplan Bewertung v2, T4, Nutzer
 * 2026-09-29): 0,5 bis 5 in halben Schritten, optional. Zehn native Radios
 * im Feld `gesamtnote` (lib/bewertung-eingabe.ts), je Blatthälfte ein Label,
 * die Pfeiltasten gehen nativ ±0,5.
 *
 * Zwei Bedienungen je Zeiger (Projektregel Touch-Ziele ≥ 44 px, Fitts):
 * - Maus: Klick links gibt das halbe, rechts das ganze Blatt (Hälfte am
 *   Desktop 40 × 80 px), mit Vorschau unter dem Zeiger.
 * - Touch (`pointer-coarse`): das ganze Blatt ist ein Ziel für ganze Werte
 *   (bei 320 px 57 × 57, bei 390 px gut 71 × 71 px), halbe Schritte über das
 *   Paar Minus/Plus (44 × 44 px) unter der Reihe. Die beiden sitzen fest an
 *   den Rändern der Reihe und springen nicht, wenn sich der Wert ändert.
 */
export function BlattNote({
  start,
  texte,
  sprache,
  onChange,
}: {
  start: number | null;
  texte: BlattNoteTexte;
  sprache: Sprache;
  /**
   * Ruft bei jeder Änderung den neuen Wert (Blatt-Klick, Minus/Plus oder Entfernen); das Formular
   * bleibt unverändert (Radios), der Rückruf ist zusätzlich. `BewertungsFormular` hält so die eigene
   * Gesamtnote für das Sortenfazit (lib/fazit.ts, T6, Review-Befund T6-R1: nie die
   * Community-Gesamtnote unterschieben).
   */
  onChange?: (note: number | null) => void;
}) {
  const [note, setNote] = useState(start);
  const [vorschau, setVorschau] = useState<number | null>(null);
  // Ansage nach Minus/Plus: der Fokus bleibt am Knopf, die Radios sagen den Wert dort nicht an.
  const [ansage, setAnsage] = useState("");
  const hinweisId = useId();
  const erstesRadio = useRef<HTMLInputElement>(null);
  const fuellungen = blattFuellungen(vorschau ?? note);
  const wertText = (wert: number) => t(texte.blattWert, { wert: formatiereWert(wert, sprache) });
  // Setzt den Wert und meldet ihn nach oben, an jeder der drei Stellen, die note ändern.
  const melden = (neu: number | null) => {
    setNote(neu);
    onChange?.(neu);
  };
  const schritt = (richtung: 1 | -1) => {
    const neu = halbSchritt(note, richtung);
    if (neu === note) return;
    melden(neu);
    setAnsage(neu === null ? texte.keineNote : wertText(neu));
  };

  return (
    <fieldset className="blatt-note" aria-describedby={hinweisId}>
      <legend className="w-full text-center font-buch text-h2 font-medium text-balance text-text">{texte.gesamtnote}</legend>
      <div className="mt-4 flex flex-col items-center gap-4 text-center">
        <p id={hinweisId} className="max-w-[60ch] text-small text-pretty text-text-muted">
          <span className="pointer-coarse:hidden">{texte.gesamtnoteHinweis}</span>
          <span className="hidden pointer-coarse:inline">{texte.gesamtnoteHinweisTouch}</span>
        </p>
        <div className="flex w-full max-w-100" onPointerLeave={() => setVorschau(null)}>
          {BLAETTER.map((blatt, index) => (
            <span key={blatt} className="relative aspect-square min-w-0 flex-1">
              <BlattGlyphe fuellung={fuellungen[index]} vorschau={vorschau !== null} />
              {[blatt - 0.5, blatt].map((stufe) => (
                <label
                  key={stufe}
                  className={cn(
                    "absolute inset-y-0 w-1/2 cursor-pointer outline-offset-2 outline-focus-ring has-[input:focus-visible]:outline-2",
                    // Touch: das ganze Blatt gibt den ganzen Wert, die halbe Hälfte bleibt nur für Tastatur und Screenreader.
                    stufe === blatt ? "right-0 pointer-coarse:left-0 pointer-coarse:w-full" : "left-0 pointer-coarse:pointer-events-none",
                  )}
                  // Vorschau nur mit der Maus: ein Tippen soll keinen Hover-Zustand hinterlassen.
                  onPointerEnter={(ereignis) => {
                    if (ereignis.pointerType === "mouse") setVorschau(stufe);
                  }}
                >
                  <input
                    ref={stufe === 0.5 ? erstesRadio : undefined}
                    type="radio"
                    name="gesamtnote"
                    value={stufe}
                    checked={note === stufe}
                    onChange={() => melden(stufe)}
                    className="sr-only"
                  />
                  <span className="sr-only">{wertText(stufe)}</span>
                </label>
              ))}
            </span>
          ))}
        </div>
        <div className="grid w-full max-w-100 grid-cols-[auto_1fr_auto] items-center gap-2">
          <button
            type="button"
            aria-label={texte.halbWeniger}
            aria-disabled={note === null || note <= 0.5 ? true : undefined}
            onClick={() => schritt(-1)}
            className={STUFEN_KNOPF}
          >
            <span aria-hidden="true">−</span>
          </button>
          <p aria-hidden="true" className={cn("col-start-2 text-small text-text-muted", note !== null && "numeric")}>
            {note === null ? texte.keineNote : wertText(note)}
          </p>
          <button
            type="button"
            aria-label={texte.halbMehr}
            aria-disabled={note !== null && note >= 5 ? true : undefined}
            onClick={() => schritt(1)}
            className={STUFEN_KNOPF}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <span role="status" className="sr-only">
          {ansage}
        </span>
        {/* Immer im Fluss, nur unsichtbar ohne Note: kein Layoutsprung beim ersten Klick. */}
        <button
          type="button"
          onClick={() => {
            melden(null);
            // Der Knopf verschwindet; der Fokus bleibt in der Gruppe statt auf der Seite.
            erstesRadio.current?.focus();
          }}
          className={cn(
            "min-h-11 text-small text-accent underline underline-offset-4 hover:text-accent-hover",
            note === null && "invisible",
          )}
        >
          {texte.noteEntfernen}
        </button>
      </div>
    </fieldset>
  );
}
