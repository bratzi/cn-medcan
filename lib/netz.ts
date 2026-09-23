/**
 * Geometrie des Netzdiagramms (Geschmacksmatrix im neuesten Eintrag).
 * Reine Funktionen, damit die Darstellung testbar bleibt.
 */

export type NetzPunkt = { x: number; y: number };

/** Eine Nachkommastelle reicht fuer SVG; "+ 0" macht aus -0 eine 0. */
function runde(zahl: number): number {
  return Math.round(zahl * 10) / 10 + 0;
}

/**
 * Punkte je Achse: die erste Achse zeigt nach oben, die weiteren folgen im
 * Uhrzeigersinn. Werte werden auf 0 bis max begrenzt.
 */
export function netzPunkte(
  werte: readonly number[],
  max: number,
  radius: number,
  mitte: number,
): NetzPunkt[] {
  const anzahl = werte.length;
  return werte.map((wert, index) => {
    const anteil = max > 0 ? Math.min(Math.max(wert / max, 0), 1) : 0;
    const winkel = ((-90 + (360 / anzahl) * index) * Math.PI) / 180;
    return {
      x: runde(mitte + Math.cos(winkel) * radius * anteil),
      y: runde(mitte + Math.sin(winkel) * radius * anteil),
    };
  });
}

export function alsPolygon(punkte: readonly NetzPunkt[]): string {
  return punkte.map((p) => `${p.x},${p.y}`).join(" ");
}

/** parseGeschmacksMatrix faellt bei kaputten Daten auf Nullen zurueck: dann kein Netz. */
export function istLeereMatrix(werte: readonly number[]): boolean {
  return werte.every((wert) => wert <= 0);
}
