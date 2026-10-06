import type { AromaSerie } from "@/components/review/AromaKarte";
import type { EintragDaten } from "@/components/review/eintrag";
import { herstellerProfil, type KartenTerpen } from "@/lib/aromakarte";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { terpenAnAus, type TerpenIntensitaet } from "@/lib/query/bewertung";

/** Zwei Serien: was die Herstellerangaben erwarten lassen und was diese Bewertung gefunden hat. */
export function aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[] {
  const hersteller = herstellerProfil(eintrag.terpene);
  const serien: AromaSerie[] = [];
  if (hersteller) serien.push({ name: w.aroma.serien.hersteller, ton: "gruen", matrix: hersteller });
  serien.push({ name: w.review.dieseBewertung, ton: "lila", matrix: eintrag.geschmacksMatrix });
  return serien;
}

/**
 * Die Terpenwahl des Bewertenden als Stärke je Terpen der Sorte für die Karte: 1 gewählt, 0 nicht.
 * Seit 2026-10-03 speichert die Maske an (1) oder aus (0); Bewertungen davor tragen Stufen bis 5,
 * jede Stufe über 0 gilt als an (terpenAnAus). Ohne gespeicherte Wahl gibt es nichts zu zeigen:
 * undefined, die Karte nimmt dann die Herstellerangaben. Eine Wahl, die kein Terpen der Sorte trifft,
 * blendet alle aus. Vom Bewertenden ergänzte Terpene, die der Hersteller nicht nennt, kennt die
 * Karte im Buch nicht.
 */
export function terpenWahlStaerken(
  terpene: readonly KartenTerpen[],
  wahl: TerpenIntensitaet,
): Record<string, number> | undefined {
  if (Object.keys(wahl).length === 0) return undefined;
  return Object.fromEntries(terpene.map((terpen) => [terpen.name, terpenAnAus(wahl[terpen.name] ?? 0)]));
}
