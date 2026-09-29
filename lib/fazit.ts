/**
 * Fazit v2 (Masterplan Bewertung v2, T6, Nutzer 2026-09-29): neu gebaut und in
 * zwei Teile getrennt, die nie ineinanderfließen.
 * - Sortenfazit: Overall (Gesamteindruck 1..5), Terpen-Abgleich (Herstellertreue
 *   0..1) und Gesamtnote (0,5 bis 5 Blätter, falls vorhanden), je zu gleichen
 *   Teilen als Anteil 0 bis 1.
 * - Chargenfazit: allein die Qualitäts-Balance der Beschaffenheit, mit dem
 *   Sweet Spot in der Mitte der Skala (qualitaetsScore, lib/bewertung-v2.ts),
 *   nicht "mehr ist besser" wie vor T6. Die Charge fließt nie in den
 *   Sortenwert; `sortenFazit` kennt sie gar nicht.
 * Stufen ohne Werte fallen heraus; ohne jede Stufe gibt es kein Fazit (null),
 * nie 0 oder NaN. Reine Funktionen, keine Wirkungsaussage (HWG): sie fassen
 * nur Bewertungen zusammen.
 */
import { qualitaetsScore } from "@/lib/bewertung-v2";

type Werte = Partial<Record<string, number>>;

function mittel(zahlen: readonly number[]): number | null {
  return zahlen.length ? zahlen.reduce((a, b) => a + b, 0) / zahlen.length : null;
}

function zahlenAus(werte: Werte): number[] {
  return Object.values(werte).filter((wert): wert is number => typeof wert === "number" && Number.isFinite(wert));
}

/** Rundet Fließkommareste weg und hält das Ergebnis in den Grenzen 0 bis 1. */
function alsAnteil(ergebnis: number | null): number | null {
  return ergebnis === null ? null : Math.min(Math.max(ergebnis, 0), 1);
}

export type SortenStufen = {
  /** Gesamteindruck 1..5 je Note (aussehen, geruch, geschmack, konsistenz); Wirkung zählt nie mit. */
  eindruck: Werte;
  /** Herstellertreue 0..1: wie nah das Geschmacksprofil an der Herstellerangabe liegt. */
  treue: number | null;
  /** Gesamtnote 0,5 bis 5 (Blätter, lib/bewertung-v2.ts gesamtnoteGueltig), falls vorhanden. */
  gesamtnote: number | null;
};

/**
 * Fazit der Sorte: Mittel aus Overall, Terpen-Abgleich und Gesamtnote, je zu
 * gleichen Teilen. Fehlt eine Stufe, fällt sie heraus statt mit 0 zu zählen;
 * fehlen alle, gibt es kein Fazit. Die Charge (Beschaffenheit) ist hier
 * bewusst kein Parameter, sie fließt nie in den Sortenwert.
 */
export function sortenFazit(stufen: SortenStufen): number | null {
  const eindruck = mittel(zahlenAus(stufen.eindruck));
  const teile = [
    eindruck === null ? null : (eindruck - 1) / 4,
    stufen.treue,
    stufen.gesamtnote === null ? null : (stufen.gesamtnote - 0.5) / 4.5,
  ].filter((teil): teil is number => teil !== null && Number.isFinite(teil));
  return alsAnteil(mittel(teile));
}

/**
 * Fazit der Charge: Qualitäts-Balance der Beschaffenheit (chlorophyll,
 * budDichte, terpenDichte, trichomFarbe, je 0 bis 5), mit dem Sweet Spot in
 * der Mitte der Skala statt "mehr ist besser". Ohne Werte kein Fazit.
 */
export function chargenFazit(beschaffenheit: Werte): number | null {
  return alsAnteil(mittel(zahlenAus(beschaffenheit).map(qualitaetsScore)));
}
