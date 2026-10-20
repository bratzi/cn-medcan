import type { Neuigkeit } from "./eintraege";

export type Monatsgruppe = { monat: string; eintraege: Neuigkeit[] };

/**
 * Gruppiert nach Monat ("YYYY-MM"), neueste zuerst. Gleiches Datum behält die
 * Reihenfolge im Array (Array.prototype.sort ist stabil).
 */
export function nachMonat(liste: readonly Neuigkeit[]): Monatsgruppe[] {
  const sortiert = [...liste].sort((a, b) => b.datum.localeCompare(a.datum));
  const gruppen: Monatsgruppe[] = [];
  for (const eintrag of sortiert) {
    const monat = eintrag.datum.slice(0, 7);
    const letzte = gruppen.at(-1);
    if (letzte?.monat === monat) letzte.eintraege.push(eintrag);
    else gruppen.push({ monat, eintraege: [eintrag] });
  }
  return gruppen;
}
