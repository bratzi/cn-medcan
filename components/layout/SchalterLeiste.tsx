import { SparSchalter, ZeigerSchalter } from "@/components/layout/EinstellungSchalter";
import { SprachSchalter } from "@/components/layout/SprachSchalter";
import { ThemaSchalter } from "@/components/layout/ThemaSchalter";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Schalter (T2, Nutzer 2026-09-29): Sprache, Thema, Zeiger, Sparmodus; jedes
 * Symbol hat 44 px Trefferfläche. Ab lg senkrecht mittig am rechten Rand,
 * zurückhaltend, bis man sie ansieht oder fokussiert. Darunter als Reihe im
 * Aufklappmenü (`imMenue`): am Rand lag die Leiste schmal über Terpenband und
 * Text (Nutzer 2026-10-08). Je Breite steht nur eine der beiden (globals.css).
 */
export function SchalterLeiste({ sprache, w, imMenue = false }: { sprache: Sprache; w: Woerterbuch; imMenue?: boolean }) {
  return (
    <div role="group" aria-label={w.kopf.schalter.leiste} className={imMenue ? "schalter-reihe" : "schalter-leiste"}>
      <SprachSchalter aktuell={sprache} gruppe={w.sprache.gruppe} />
      <ThemaSchalter texte={w.kopf.thema} />
      <ZeigerSchalter texte={w.kopf.schalter} />
      <SparSchalter label={w.kopf.schalter.spar} />
    </div>
  );
}
