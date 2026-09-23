/**
 * Nimmt ein Weiterleitungsziel aus der URL entgegen und gibt es nur zurueck,
 * wenn es ein eigener, relativer Pfad ist.
 *
 * Ohne diese Pruefung waere `/anmelden?weiter=https://fremd.example` eine
 * offene Weiterleitung: ein Link, der aussieht wie die eigene Anmeldung und
 * danach auf einer fremden Seite landet. Auch `//fremd.example` ist ein
 * absoluter Verweis - deshalb reicht "beginnt mit /" nicht aus.
 */
export function sicheresZiel(wert: string | undefined, standard: string): string {
  if (!wert) return standard;
  if (!wert.startsWith("/")) return standard;
  if (wert.startsWith("//")) return standard;
  // "/\fremd.example" wird von manchen Browsern wie "//" behandelt.
  if (wert.startsWith("/\\")) return standard;
  return wert;
}
