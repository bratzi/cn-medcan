import type { AromaSerie } from "@/components/review/AromaKarte";
import type { EintragDaten } from "@/components/review/eintrag";
import {
  ERGAENZT_HOECHSTENS,
  ergaenztesTerpen,
  herstellerProfil,
  terpenEbenen,
  type KartenTerpen,
  type TerpenEbene,
} from "@/lib/aromakarte";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { terpenAnAus, type TerpenIntensitaet } from "@/lib/query/bewertung";
import type { KatalogTerpen } from "@/lib/query/strains";

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
 * blendet alle aus. Vom Bewertenden ergänzte Terpene bringt `buchKarte` dazu.
 */
export function terpenWahlStaerken(
  terpene: readonly KartenTerpen[],
  wahl: TerpenIntensitaet,
): Record<string, number> | undefined {
  if (Object.keys(wahl).length === 0) return undefined;
  return Object.fromEntries(terpene.map((terpen) => [terpen.name, terpenAnAus(wahl[terpen.name] ?? 0)]));
}

/**
 * Was die Karte im Buch zeigt: die Terpene der Sorte und dazu die, die der Bewertende selbst
 * ergänzt hat (an, laut Hersteller nicht enthalten), wie in der Maske gestrichelt in Lila und
 * gedämpft (ERGAENZT_HOECHSTENS), damit die Herstellerangabe führt. Live 2026-10-06 fehlten sie
 * im Buch. Den Geschmack eines ergänzten Terpens liefert der Katalog; ein Name, den er nicht
 * kennt, fällt weg. Ohne Ergänzung keine Ebenen, die Karte bleibt wie bisher.
 */
export function buchKarte(
  terpene: readonly KartenTerpen[],
  katalog: readonly KatalogTerpen[],
  wahl: TerpenIntensitaet,
): { terpene: readonly KartenTerpen[]; staerken: Record<string, number> | undefined; ebenen: Record<string, TerpenEbene> | undefined } {
  const staerken = terpenWahlStaerken(terpene, wahl);
  const herstellerNamen = terpene.map((terpen) => terpen.name);
  const angegeben = new Set(herstellerNamen);
  const ergaenzt = katalog
    .filter((terpen) => !angegeben.has(terpen.name) && terpenAnAus(wahl[terpen.name] ?? 0) === 1)
    .map((terpen) => ergaenztesTerpen(terpen.name, terpen.geschmack));
  if (ergaenzt.length === 0) return { terpene, staerken, ebenen: undefined };
  const alle = [...terpene, ...ergaenzt];
  return {
    terpene: alle,
    staerken: { ...staerken, ...Object.fromEntries(ergaenzt.map((terpen) => [terpen.name, ERGAENZT_HOECHSTENS])) },
    ebenen: terpenEbenen(alle.map((terpen) => terpen.name), herstellerNamen, wahl),
  };
}
