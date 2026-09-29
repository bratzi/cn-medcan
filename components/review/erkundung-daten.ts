import { mittleBeschaffenheit } from "@/components/review/BeschaffenheitsLeiste";
import { mittleNoten } from "@/components/review/GesamteindruckLeiste";
import type { AromaSerie } from "@/components/review/AromaKarte";
import { communityMedian, herstellerProfil, mittlereHerstellerTreue, type KartenTerpen } from "@/lib/aromakarte";
import {
  mittleTerpenIntensitaet,
  parseBeschaffenheit,
  parseGeschmacksMatrix,
  parseTerpenIntensitaet,
  verdichteGeschmacksMatrix,
} from "@/lib/query/bewertung";

/** Was eine Bewertung für die Erkundung mitbringen muss. */
type Bewertung = {
  aussehen: number;
  geruch: number;
  geschmack: number;
  konsistenz: number;
  feuchtigkeitProzent: number | null;
  geschmacksMatrix: unknown;
  terpenIntensitaet: unknown;
  beschaffenheit: unknown;
};

/** Die Zeile aus `sorten_kennwerte` (T3), roh wie aus D1. */
type RoheKennwerte = { terpenMedian: unknown; geschmackMedian: unknown; gesamtnoteMedian: number | null; anzahl: number };

/**
 * Die Daten der Aroma-Erkundung aus Terpenen und freigegebenen Bewertungen,
 * einmal für Startseite, Blütenseite und Bewertungsmaske (Nutzer 2026-09-25:
 * die Maske sieht exakt aus wie die Startseite).
 *
 * Community-Werte der Karte kommen aus dem Median in `sorten_kennwerte`, beim
 * Speichern vorberechnet (Masterplan Bewertung v2, T5): der grüne Regler, die
 * lila Reihe und die Sweet-Spot-Zeilen zeigen denselben Wert. Ohne Kennwerte
 * gibt es keinen Median (kein grüner Regler); die Reihe bleibt dann das Mittel.
 */
export function erkundungsDaten(
  terpene: readonly KartenTerpen[],
  reviews: readonly Bewertung[],
  /** Legendennamen der Serien in der Sprache der Seite (w.aroma.serien). */
  namen: { hersteller: string; community: string },
  kennwerte: RoheKennwerte | null = null,
) {
  const hersteller = herstellerProfil(terpene);
  const community = verdichteGeschmacksMatrix(reviews);
  const median = communityMedian(kennwerte);
  const serien: AromaSerie[] = [
    ...(hersteller ? [{ name: namen.hersteller, ton: "gruen" as const, matrix: hersteller }] : []),
    ...(community.anzahlBewertungen > 0
      ? [{ name: namen.community, ton: "lila" as const, matrix: median?.geschmack ?? community.matrix }]
      : []),
  ];
  const intensitaet = mittleTerpenIntensitaet(reviews.map((review) => parseTerpenIntensitaet(review.terpenIntensitaet)));
  return {
    serien,
    median,
    treue: mittlereHerstellerTreue(hersteller, reviews.map((review) => parseGeschmacksMatrix(review.geschmacksMatrix))),
    zeilen: Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({
      terpen,
      wert: median?.terpene[terpen] ?? mittel,
      anzahl,
    })),
    gesamteindruck: mittleNoten(reviews),
    beschaffenheit: mittleBeschaffenheit(
      reviews.map((review) => ({
        beschaffenheit: parseBeschaffenheit(review.beschaffenheit),
        feuchte: review.feuchtigkeitProzent,
      })),
    ),
    // Median der Gesamtnote (sorten_kennwerte, T3): eine Stufe des Sortenfazits
    // (lib/fazit.ts, sortenFazit), beim Speichern vorberechnet, nie je Seitenaufruf.
    gesamtnoteMedian: kennwerte?.gesamtnoteMedian ?? null,
  };
}
