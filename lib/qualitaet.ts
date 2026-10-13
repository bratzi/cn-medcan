import { median, qualitaetsScore } from "@/lib/bewertung-v2";
import { BESCHAFFENHEIT_ACHSEN, type Beschaffenheit } from "@/lib/query/bewertung";

const OHNE_SWEET_SPOT = new Set<string>(BESCHAFFENHEIT_ACHSEN.filter((a) => !a.sweetSpot).map((a) => a.key));

/** Eine Regel je Achse (0 bis 1): Sweet Spot in der Mitte, bei Achsen ohne Sweet Spot (Frische) linear. */
export function achsenScore(key: string, wert: number): number {
  return OHNE_SWEET_SPOT.has(key) ? wert / 5 : qualitaetsScore(wert);
}

const eineStelle = (x: number) => Math.round(x * 10) / 10;

/**
 * Qualität einer Charge 0 bis 5 (Spec 2026-10-13): je Achse 1 im Sweet Spot, 0 am Rand;
 * Frische linear (mehr ist besser). Ohne Achse null: eine Bewertung nur mit Overall zählt nicht als 0.
 */
export function qualitaetAusBeschaffenheit(b: Beschaffenheit): number | null {
  const werte = Object.entries(b).filter((e): e is [string, number] => typeof e[1] === "number");
  if (werte.length === 0) return null;
  const summe = werte.reduce((s, [key, wert]) => s + achsenScore(key, wert), 0);
  return eineStelle((summe / werte.length) * 5);
}

export type QualitaetsKennwerte = {
  qualitaetMittel: number | null;
  achsenMittel: Record<string, number>;
  restfeuchteMedian: number | null;
  anzahl: number;
};

/** Kennwerte der Chargenqualität über mehrere Bewertungen (je Handelsname oder je Vertreiber). */
export function qualitaetsKennwerte(
  zeilen: readonly { beschaffenheit: Beschaffenheit; feuchtigkeitProzent: number | null }[],
): QualitaetsKennwerte {
  const qualitaeten: number[] = [];
  const feuchten: number[] = [];
  const achsen = new Map<string, number[]>();
  let anzahl = 0;
  for (const z of zeilen) {
    const q = qualitaetAusBeschaffenheit(z.beschaffenheit);
    if (q !== null) qualitaeten.push(q);
    if (z.feuchtigkeitProzent !== null) feuchten.push(z.feuchtigkeitProzent);
    if (q !== null || z.feuchtigkeitProzent !== null) anzahl += 1;
    for (const [key, wert] of Object.entries(z.beschaffenheit)) {
      if (typeof wert !== "number") continue;
      achsen.set(key, [...(achsen.get(key) ?? []), wert]);
    }
  }
  const mittel = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length;
  return {
    qualitaetMittel: qualitaeten.length === 0 ? null : eineStelle(mittel(qualitaeten)),
    achsenMittel: Object.fromEntries([...achsen].map(([k, l]) => [k, Math.round(mittel(l) * 100) / 100])),
    restfeuchteMedian: median(feuchten),
    anzahl,
  };
}
