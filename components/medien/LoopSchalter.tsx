import { SchalterSymbole } from "@/components/medien/SchalterSymbole";
import { holeWoerterbuch } from "@/lib/i18n";

/**
 * Anhalten/Abspielen der Video-Schleifen (WCAG 2.2.2) als dezentes Symbol:
 * Pause, solange sie laufen, Play, wenn angehalten. Der Name steht in
 * aria-label; loops.ts setzt ihn und data-angehalten und blendet den Knopf
 * erst ein, wenn es Videos startet (ohne JavaScript läuft nichts).
 */
export async function LoopSchalter({ className = "" }: { className?: string }) {
  const { start } = await holeWoerterbuch();
  return (
    <button type="button" hidden data-loop-schalter="" aria-label={start.video.anhalten}
      data-label-anhalten={start.video.anhalten}
      data-label-abspielen={start.video.abspielen}
      className={`loop-schalter ${className}`}
    >
      <SchalterSymbole />
    </button>
  );
}
