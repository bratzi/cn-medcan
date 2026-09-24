import { unstable_rethrow } from "next/navigation";

/**
 * Laedt einen Wert fuer eine Sektion der Startseite und ersetzt einen Fehler
 * durch `ersatz` (Spec 5.2: eine scheiternde Abfrage darf die Seite nicht
 * kosten). Next-interne Unterbrechungen (redirect, notFound, dynamisches
 * Rendern) gehen trotzdem durch.
 */
export async function sicher<T>(laden: () => Promise<T>, ersatz: T, wofuer: string): Promise<T> {
  try {
    return await laden();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error(`${wofuer} fehlgeschlagen`, fehler);
    return ersatz;
  }
}
