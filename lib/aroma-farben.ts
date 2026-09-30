import type { GeschmacksKategorie } from "@/db/enums";

/**
 * Farbe je Geschmacksrichtung (Nutzer 2026-09-26): Zitrus gelb, Süß pink,
 * Kräutrig moosgrün, Minzig minzgrün, Holzig braun, Würzig zimt, Erdig
 * erdbraun, Diesel grau; Fruchtig und Blumig als bunter Verlauf (null =
 * Verlauf aus VERLAUF). Eine Quelle für Aroma-Karte und Startseiten-Register
 * (T17, Nutzer 2026-09-30).
 */
export const LINIEN_FARBE: Record<GeschmacksKategorie, string | null> = {
  ZITRUS: "#f2d129",
  FRUCHTIG: null,
  SUESS: "#ff5fa8",
  BLUMIG: null,
  KRAEUTRIG: "#7d9a3c",
  MINZIG: "#5fe0b8",
  HOLZIG: "#9b6a3f",
  WUERZIG: "#c98a3e",
  ERDIG: "#7a5536",
  DIESEL: "#9aa1a8",
};

export const VERLAUF: Partial<Record<GeschmacksKategorie, readonly string[]>> & {
  FRUCHTIG: readonly string[];
  BLUMIG: readonly string[];
} = {
  FRUCHTIG: ["#ff4d4d", "#ff9f1c", "#ffd23f", "#b5179e"],
  BLUMIG: ["#c77dff", "#ff70a6", "#ffd670", "#8ecae6"],
};

/** CSS-Hintergrund einer Geschmacksrichtung: feste Farbe oder waagerechter Verlauf. */
export function farbFlaeche(geschmack: GeschmacksKategorie): string {
  const farbe = LINIEN_FARBE[geschmack];
  if (farbe) return farbe;
  const verlauf = VERLAUF[geschmack] ?? ["#9aa1a8"];
  return `linear-gradient(90deg, ${verlauf.join(", ")})`;
}
