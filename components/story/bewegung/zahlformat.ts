/**
 * Zahlformat der Zaehl-Animationen in der Sprache der Seite (<html lang>,
 * vom Root-Layout gesetzt). Einmal je Sprache und Stellenzahl gebaut; der
 * Server rendert den Endwert schon richtig, die Animation darf ihn nicht
 * deutsch ueberschreiben.
 */
const CACHE = new Map<string, Intl.NumberFormat>();

export function zahlFormat(lang: string, stellen: number): Intl.NumberFormat {
  const locale = lang.startsWith("en") ? "en-GB" : "de-DE";
  const schluessel = `${locale}:${stellen}`;
  let format = CACHE.get(schluessel);
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
    CACHE.set(schluessel, format);
  }
  return format;
}
