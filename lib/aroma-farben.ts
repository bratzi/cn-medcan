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

/**
 * Volltonfarbe einer Geschmacksrichtung für Marken und Punkte (Aroma-Netz,
 * Nutzer 2026-10-09): feste Farbe oder die erste Stufe des Verlaufs, denn ein
 * Verlauf ist als Text- oder Strichfarbe ungültig.
 */
export function vollFarbe(geschmack: GeschmacksKategorie): string {
  return LINIEN_FARBE[geschmack] ?? VERLAUF[geschmack]?.[0] ?? "#9aa1a8";
}

/**
 * Farbkreis des Aroma-Netzes (Aroma-Blüte): jede Achse trägt ihre Farbe in
 * ihrer Richtung, die erste Achse zeigt nach oben, die weiteren im
 * Uhrzeigersinn wie in lib/netz.ts. Zwischen zwei Achsen mischt der Browser.
 */
export function bluetenKreis(achsen: readonly GeschmacksKategorie[]): string {
  if (achsen.length === 0) return "transparent";
  const schritt = 360 / achsen.length;
  const stufen = achsen.map((geschmack, index) => `${vollFarbe(geschmack)} ${Math.round(schritt * index * 10) / 10}deg`);
  return `conic-gradient(from 0deg at 50% 50%, ${stufen.join(", ")}, ${vollFarbe(achsen[0])} 360deg)`;
}
