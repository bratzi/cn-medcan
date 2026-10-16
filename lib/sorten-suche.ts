/** Sortensuche im Explorer: ab zwei Zeichen, höchstens zwölf Treffer. Ohne Abhängigkeiten, auch für den Browser. */
export const SUCHE_MIN = 2;
export const SUCHE_MAX = 12;
const EINGABE_MAX = 40;

/**
 * Suchtext bereinigen und klein schreiben (auch Cache-Schlüssel); `null`, wenn er zu kurz ist
 * (dann gibt es keine Abfrage).
 */
export function normalisiereSuche(roh: string | null | undefined): string | null {
  const text = (roh ?? "").replace(/\s+/g, " ").trim().slice(0, EINGABE_MAX).trim().toLowerCase();
  return text.length >= SUCHE_MIN ? text : null;
}

/**
 * Die eine Suchbedingung für Blütenliste und Explorer: die kleingeschriebene Spalte `strain.suchtext`
 * (Handelsname, Kultivarname, Genetik; beim Schreiben gefüllt) enthält den kleingeschriebenen Text.
 */
export function suchtextBedingung(text: string): { suchtext: { contains: string } } {
  return { suchtext: { contains: text.toLowerCase() } };
}
