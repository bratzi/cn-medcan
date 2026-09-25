import { mittleBeschaffenheit } from "@/components/review/BeschaffenheitsLeiste";
import { mittleNoten } from "@/components/review/GesamteindruckLeiste";
import type { AromaSerie } from "@/components/review/AromaKarte";
import { herstellerProfil, mittlereHerstellerTreue, type KartenTerpen } from "@/lib/aromakarte";
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

/**
 * Die Daten der Aroma-Erkundung aus Terpenen und freigegebenen Bewertungen,
 * einmal für Startseite, Blütenseite und Bewertungsmaske (Nutzer 2026-09-25:
 * die Maske sieht exakt aus wie die Startseite).
 */
export function erkundungsDaten(terpene: readonly KartenTerpen[], reviews: readonly Bewertung[]) {
  const hersteller = herstellerProfil(terpene);
  const community = verdichteGeschmacksMatrix(reviews);
  const serien: AromaSerie[] = [
    ...(hersteller ? [{ name: "Laut Hersteller", ton: "gruen" as const, matrix: hersteller }] : []),
    ...(community.anzahlBewertungen > 0 ? [{ name: "Laut Community", ton: "lila" as const, matrix: community.matrix }] : []),
  ];
  const intensitaet = mittleTerpenIntensitaet(reviews.map((review) => parseTerpenIntensitaet(review.terpenIntensitaet)));
  return {
    serien,
    treue: mittlereHerstellerTreue(hersteller, reviews.map((review) => parseGeschmacksMatrix(review.geschmacksMatrix))),
    zeilen: Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({ terpen, wert: mittel, anzahl })),
    gesamteindruck: mittleNoten(reviews),
    beschaffenheit: mittleBeschaffenheit(
      reviews.map((review) => ({
        beschaffenheit: parseBeschaffenheit(review.beschaffenheit),
        feuchte: review.feuchtigkeitProzent,
      })),
    ),
  };
}
