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
  "gesamtnote" | "gesamtnoteHinweis" | "blattWert" | "keineNote" | "noteEntfernen"
>;

/**
 * Gesamtnote mit fünf Cannabisblättern (Masterplan Bewertung v2, T4, Nutzer
 * 2026-09-29): 0,5 bis 5 in halben Schritten, optional. Zehn native Radios
 * im Feld `gesamtnote` (lib/bewertung-eingabe.ts), je Blatthälfte ein Label:
 * Klick links gibt das halbe, rechts das ganze Blatt, die Pfeiltasten gehen
 * nativ ±0,5. Die Hälften liegen ohne Lücke nebeneinander, das Blatt wächst
 * mit der Breite (bei 390 px gut 35 × 70 px je Hälfte, am Desktop 40 × 80 px).
 */
export function BlattNote({ start, texte, sprache }: { start: number | null; texte: BlattNoteTexte; sprache: Sprache }) {
  const [note, setNote] = useState(start);
  const [vorschau, setVorschau] = useState<number | null>(null);
  const hinweisId = useId();
  const erstesRadio = useRef<HTMLInputElement>(null);
  const fuellungen = blattFuellungen(vorschau ?? note);
  const wertText = (wert: number) => t(texte.blattWert, { wert: formatiereWert(wert, sprache) });

  return (
    <fieldset className="blatt-note" aria-describedby={hinweisId}>
      <legend className="w-full text-center font-buch text-h2 font-medium text-balance text-text">{texte.gesamtnote}</legend>
      <div className="mt-4 flex flex-col items-center gap-4 text-center">
        <p id={hinweisId} className="max-w-[60ch] text-small text-pretty text-text-muted">
          {texte.gesamtnoteHinweis}
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
                    stufe === blatt ? "right-0" : "left-0",
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
                    onChange={() => setNote(stufe)}
                    className="sr-only"
                  />
                  <span className="sr-only">{wertText(stufe)}</span>
                </label>
              ))}
            </span>
          ))}
        </div>
        <p aria-hidden="true" className={cn("text-small text-text-muted", note !== null && "numeric")}>
          {note === null ? texte.keineNote : wertText(note)}
        </p>
        {/* Immer im Fluss, nur unsichtbar ohne Note: kein Layoutsprung beim ersten Klick. */}
        <button
          type="button"
          onClick={() => {
            setNote(null);
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
