/**
 * Minimale Klassen-Hilfe. Bewusst ohne clsx/tailwind-merge:
 * jede Abhaengigkeit landet im Workers-Bundle.
 */
export type KlassenWert = string | false | null | undefined;

export function cn(...werte: KlassenWert[]): string {
  let ergebnis = "";
  for (const wert of werte) {
    if (!wert) continue;
    ergebnis = ergebnis ? `${ergebnis} ${wert}` : wert;
  }
  return ergebnis;
}
