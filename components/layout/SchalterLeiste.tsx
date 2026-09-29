import { SparSchalter, ZeigerSchalter } from "@/components/layout/EinstellungSchalter";
import { SprachSchalter } from "@/components/layout/SprachSchalter";
import { ThemaSchalter } from "@/components/layout/ThemaSchalter";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Schalter unten rechts, senkrecht (T2, Nutzer 2026-09-29): Sprache, Thema,
 * Zeiger, Sparmodus. Zurückhaltend, bis man sie ansieht oder fokussiert;
 * jedes Symbol hat 44 px Trefferfläche.
 */
export function SchalterLeiste({ sprache, w }: { sprache: Sprache; w: Woerterbuch }) {
  return (
    <div role="group" aria-label={w.kopf.schalter.leiste} className="schalter-leiste">
      <SprachSchalter aktuell={sprache} gruppe={w.sprache.gruppe} />
      <ThemaSchalter texte={w.kopf.thema} />
      <ZeigerSchalter label={w.kopf.schalter.zeiger} />
      <SparSchalter label={w.kopf.schalter.spar} />
    </div>
  );
}
