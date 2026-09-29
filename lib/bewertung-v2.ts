/**
 * Regeln der Bewertung v2 (Masterplan 2026-09-29, T3). Reine Funktionen ohne
 * Datenbank; die Server Action schreibt damit `sorten_kennwerte` fort.
 *
 * - Gesamtnote: 0,5 bis 5 in halben Schritten, je höher desto besser.
 * - Qualität gilt der Charge (Beschaffenheit 0-5), Sweet Spot in der Mitte.
 *   Sie fließt nicht in die Sortenkennwerte.
 * - Terpene und Geschmack: Median der Community je Schlüssel.
 */

export type Werte = Record<string, number>;

export const QUALITAET_MITTE = 2.5;
export const QUALITAET_HALBSPANNE = 2.5;

export function median(zahlen: readonly number[]): number | null {
  if (zahlen.length === 0) return null;
  const s = [...zahlen].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function gesamtnoteGueltig(wert: number): boolean {
  return Number.isFinite(wert) && wert >= 0.5 && wert <= 5 && Number.isInteger(wert * 2);
}

/** 1 im Sweet Spot, 0 an den Rändern der Skala. */
export function qualitaetsScore(wert: number): number {
  return Math.max(0, 1 - Math.abs(wert - QUALITAET_MITTE) / QUALITAET_HALBSPANNE);
}

/** Median je Schlüssel über mehrere Einträge. */
export function medianJeSchluessel(alle: readonly Werte[]): Werte {
  const listen = new Map<string, number[]>();
  for (const eintrag of alle) {
    for (const [name, wert] of Object.entries(eintrag)) {
      const liste = listen.get(name) ?? [];
      liste.push(wert);
      listen.set(name, liste);
    }
  }
  return Object.fromEntries([...listen].map(([name, liste]) => [name, median(liste) as number]));
}

/**
 * Nase des Nutzers gegen die Community: mittlere |Δ| über die Terpene, die
 * beide haben, plus die Terpene, die der Nutzer ohne Herstellerangabe ergänzt.
 */
export function abweichungZurCommunity(
  eigene: Werte,
  communityMedian: Werte,
  herstellerTerpene: readonly string[],
): { mittlereAbweichung: number | null; ergaenzt: string[] } {
  const deltas = Object.entries(eigene)
    .filter(([name]) => name in communityMedian)
    .map(([name, wert]) => Math.abs(wert - communityMedian[name]));
  const mittel = deltas.length === 0 ? null : Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 100) / 100;
  const hersteller = new Set(herstellerTerpene);
  return { mittlereAbweichung: mittel, ergaenzt: Object.keys(eigene).filter((name) => !hersteller.has(name)) };
}

export type KennwertEingabe = { gesamtnote: number | null; terpene: Werte; geschmack: Werte };

export type SortenKennwerte = {
  terpenMedian: Werte;
  geschmackMedian: Werte;
  gesamtnoteMedian: number | null;
  gesamtnoteMittel: number | null;
  anzahl: number;
};

export function sortenKennwerte(bewertungen: readonly KennwertEingabe[]): SortenKennwerte {
  const noten = bewertungen.map((b) => b.gesamtnote).filter((n): n is number => n !== null);
  return {
    terpenMedian: medianJeSchluessel(bewertungen.map((b) => b.terpene)),
    geschmackMedian: medianJeSchluessel(bewertungen.map((b) => b.geschmack)),
    gesamtnoteMedian: median(noten),
    gesamtnoteMittel: noten.length === 0 ? null : Math.round((noten.reduce((a, b) => a + b, 0) / noten.length) * 100) / 100,
    anzahl: bewertungen.length,
  };
}
