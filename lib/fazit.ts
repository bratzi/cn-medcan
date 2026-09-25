/**
 * Community-Fazit (Nutzer 2026-09-25): das Fazit aus den drei Stufen der
 * Bewertung, als Anteil 0 bis 1. Jede Stufe zählt gleich:
 *   1. Gesamteindruck: Mittel der Noten 1..5, auf 0..1 gebracht (1 = 0, 5 = 1).
 *   2. Terpene: Herstellertreue 0..1 (wie nah das Geschmacksprofil an der Angabe liegt).
 *   3. Beschaffenheit: Mittel der Achsen 0..5, auf 0..1 gebracht (mehr ist besser).
 * Stufen ohne Werte fallen heraus; ohne jede Stufe gibt es kein Fazit.
 * Reine Funktion, keine Wirkungsaussage (HWG): sie fasst nur Bewertungen zusammen.
 */
type Werte = Partial<Record<string, number>>;

function mittel(zahlen: readonly number[]): number | null {
  return zahlen.length ? zahlen.reduce((a, b) => a + b, 0) / zahlen.length : null;
}

function zahlenAus(werte: Werte): number[] {
  return Object.values(werte).filter((wert): wert is number => typeof wert === "number" && Number.isFinite(wert));
}

export function communityFazit(stufen: { eindruck: Werte; treue: number | null; beschaffenheit: Werte }): number | null {
  const eindruck = mittel(zahlenAus(stufen.eindruck));
  const beschaffenheit = mittel(zahlenAus(stufen.beschaffenheit));
  const teile = [
    eindruck === null ? null : (eindruck - 1) / 4,
    stufen.treue,
    beschaffenheit === null ? null : beschaffenheit / 5,
  ].filter((teil): teil is number => teil !== null && Number.isFinite(teil));
  const ergebnis = mittel(teile);
  return ergebnis === null ? null : Math.min(Math.max(ergebnis, 0), 1);
}
