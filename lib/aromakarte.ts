/**
 * Geometrie und Daten der Aroma-Karte (Spec Redesign 14): links die acht
 * Geschmacksachsen, rechts die Terpene, dazwischen Bögen wie auf einem
 * Terpen-Poster; per Schalter morphen die Knoten ins Netzdiagramm. Reine
 * Funktionen, damit Darstellung und Verdichtung testbar bleiben.
 */
import { GESCHMACKS_ACHSEN, leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";

export type Punkt = { x: number; y: number };
export type KartenTerpen = { name: string; geschmack: GeschmacksKategorie; konzentrationProzent: number | null; rang: number };

export const BREITE = 640;
export const HOEHE = 480;
export const MAX = 5;
const LINKS_X = 260;
const RECHTS_X = 420;
const OBEN = 48;
const UNTEN = HOEHE - 48;
export const MITTE: Punkt = { x: BREITE / 2, y: HOEHE / 2 };
export const RADIUS = 180;

const runde = (zahl: number) => Math.round(zahl * 10) / 10 + 0;

/** Gleichmäßig verteilte y-Positionen einer Spalte. */
function spalte(anzahl: number, index: number): number {
  if (anzahl <= 1) return MITTE.y;
  return runde(OBEN + ((UNTEN - OBEN) / (anzahl - 1)) * index);
}

/** Knoten der Geschmacksachsen in der Karten-Ansicht (linke Spalte). */
export function achsenImKarte(): Punkt[] {
  return GESCHMACKS_ACHSEN.map((_, index) => ({ x: LINKS_X, y: spalte(GESCHMACKS_ACHSEN.length, index) }));
}

/** Knoten der Terpene (rechte Spalte). */
export function terpeneImKarte(anzahl: number): Punkt[] {
  return Array.from({ length: anzahl }, (_, index) => ({ x: RECHTS_X, y: spalte(anzahl, index) }));
}

/** Punkt einer Achse im Netz: erste Achse oben, dann im Uhrzeigersinn; Wert 0 bis MAX. */
export function netzPunkt(index: number, wert: number, radius = RADIUS): Punkt {
  const anteil = Math.min(Math.max(wert / MAX, 0), 1);
  const winkel = ((-90 + (360 / GESCHMACKS_ACHSEN.length) * index) * Math.PI) / 180;
  return { x: runde(MITTE.x + Math.cos(winkel) * radius * anteil), y: runde(MITTE.y + Math.sin(winkel) * radius * anteil) };
}

export function mische(a: Punkt, b: Punkt, t: number): Punkt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Weicher Bogen von links nach rechts wie auf dem Poster (kubische Bézierkurve). */
export function bogen(von: Punkt, nach: Punkt): string {
  const mitteX = (von.x + nach.x) / 2;
  return `M${von.x},${von.y} C${mitteX},${von.y} ${mitteX},${nach.y} ${nach.x},${nach.y}`;
}

export function alsPolygon(punkte: readonly Punkt[]): string {
  return punkte.map((p) => `${runde(p.x)},${runde(p.y)}`).join(" ");
}

const ACHSE_ZU_KATEGORIE = new Map<GeschmacksKategorie, keyof GeschmacksMatrix>(
  GESCHMACKS_ACHSEN.map((achse) => [achse.enumWert, achse.key]),
);

/**
 * Was die Herstellerangaben erwarten lassen: jedes angegebene Terpen zahlt
 * auf seine Geschmacksachse ein, gewichtet nach Konzentration, sonst nach
 * Rang (Rang 1 zählt am meisten). Die stärkste Achse wird auf 5 skaliert.
 * Ohne Terpenangaben: null.
 */
export function herstellerProfil(terpene: readonly KartenTerpen[]): GeschmacksMatrix | null {
  if (terpene.length === 0) return null;
  const matrix = leereGeschmacksMatrix();
  for (const terpen of terpene) {
    const achse = ACHSE_ZU_KATEGORIE.get(terpen.geschmack);
    if (!achse) continue;
    const gewicht = terpen.konzentrationProzent ?? Math.max(1, 4 - terpen.rang);
    matrix[achse] += gewicht;
  }
  const hoechster = Math.max(...Object.values(matrix));
  if (hoechster <= 0) return null;
  for (const achse of Object.keys(matrix) as (keyof GeschmacksMatrix)[]) {
    matrix[achse] = Math.round((matrix[achse] / hoechster) * MAX * 10) / 10;
  }
  return matrix;
}

/** Index der Geschmacksachse, zu der ein Terpen gehört (für die Bögen). */
export function achsenIndex(kategorie: GeschmacksKategorie): number {
  return GESCHMACKS_ACHSEN.findIndex((achse) => achse.enumWert === kategorie);
}

/** Easing für den Morph: sanft an, sanft aus. */
export function sanft(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
