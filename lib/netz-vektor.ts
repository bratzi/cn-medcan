import { NETZ_MAX } from "@/lib/netz-skala";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { TERPEN_ACHSEN, type TerpenNetz } from "@/lib/terpen-achsen";

/** Ansicht des Aroma-Netzes (Spec 2026-10-09 A). */
export type NetzModus = "geschmack" | "terpene";

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;
/** Wie lib/netz-aenderung: kleine Schwankungen zählen nicht. */
const SCHWELLE = 0.05;
/** Mindestbreite der Lesung in px; weniger Platz außen spiegelt sie nach innen. */
export const LESUNG_BREITE = 176;

export function geschmackVektor(g: Geschmack): number[] {
  return GESCHMACKS_ACHSEN.map((a) => g[a.enumWert] ?? 0);
}

export function terpenVektor(t: TerpenNetz): number[] {
  return TERPEN_ACHSEN.map((a) => t[a.schluessel] ?? 0);
}

export function zwischenVektor(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((x, i) => x + ((b[i] ?? 0) - x) * t);
}

/** Werte 0..5 je Achse: Fläche „mag ich“, Strichlinie „mag ich nicht“. */
export function netzAusVektor(v: readonly number[]): { mag: number[]; magNicht: number[] } {
  return { mag: v.map((x) => Math.max(0, x) * NETZ_MAX), magNicht: v.map((x) => Math.max(0, -x) * NETZ_MAX) };
}

/** Achsen mit der größten Veränderung zwischen zwei Ständen, für den Änderungssatz. */
export function vektorAenderung(vorher: readonly number[], nachher: readonly number[], hoechstens = 2) {
  return nachher
    .map((x, index) => ({ index, differenz: zwei(x - (vorher[index] ?? 0)) }))
    .filter((a) => Math.abs(a.differenz) >= SCHWELLE)
    .sort((a, b) => Math.abs(b.differenz) - Math.abs(a.differenz) || a.index - b.index)
    .slice(0, hoechstens);
}

export type LesungsLage = { seite: "links" | "rechts" | "oben" | "unten" };

/**
 * Wohin die Lesung an Achse `index` aufgeht (Nutzer 2026-10-09: nach außen, nicht in die Mitte).
 * Achse 0 zeigt nach oben, die weiteren im Uhrzeigersinn wie lib/netz.ts. `platz` ist der freie Raum
 * links und rechts der Marke im Viewport; reicht er außen nicht, geht die Lesung nach innen.
 */
export function lesungsLage(index: number, anzahl: number, platz?: { links: number; rechts: number }): LesungsLage {
  const winkel = ((index / anzahl) * 360) % 360;
  let seite: LesungsLage["seite"] =
    winkel < 20 || winkel > 340 ? "oben" : Math.abs(winkel - 180) < 20 ? "unten" : winkel < 180 ? "rechts" : "links";
  if (platz && seite === "rechts" && platz.rechts < LESUNG_BREITE) seite = "links";
  else if (platz && seite === "links" && platz.links < LESUNG_BREITE) seite = "rechts";
  return { seite };
}
