/**
 * Abstand des eigenen Sortenfazits zum Community-Fazit für die mitlaufende
 * Fazit-Leiste (T16, Nutzer 2026-09-30): man sieht beim Regeln, wohin die eigene
 * Bewertung das Fazit zieht. Gerechnet wird mit den angezeigten, auf ganze
 * Prozent gerundeten Werten, damit Delta und Anzeige nie auseinanderlaufen.
 * Reine Zusammenfassung von Bewertungen, keine Wirkungsaussage (HWG).
 */
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";

export type FazitDelta = { punkte: number; richtung: "hoch" | "runter" | "gleich" };

/** Prozentpunkte eigen minus Community, null, solange einer der Werte fehlt. */
export function fazitDelta(eigen: number | null, community: number | null): FazitDelta | null {
  if (eigen === null || community === null) return null;
  const punkte = Math.round(eigen * 100) - Math.round(community * 100);
  return { punkte, richtung: punkte > 0 ? "hoch" : punkte < 0 ? "runter" : "gleich" };
}

/** Delta mit sichtbarem Vorzeichen: `+5`, `−12` (Rechenzeichen U+2212), `±0`. */
export function formatiereDelta(punkte: number, sprache: Sprache = "de"): string {
  const betrag = formatiereZahl(Math.abs(punkte), 0, sprache);
  return `${punkte > 0 ? "+" : punkte < 0 ? "−" : "±"}${betrag}`;
}
