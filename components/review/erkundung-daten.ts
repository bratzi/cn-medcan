import { mittleBeschaffenheit } from "@/components/review/BeschaffenheitsLeiste";
import { mittleNoten } from "@/components/review/GesamteindruckLeiste";
import type { AromaSerie } from "@/components/review/AromaKarte";
import { communityMedian, herstellerProfil, mittlereHerstellerTreue, type KartenTerpen } from "@/lib/aromakarte";
import {
  BESCHAFFENHEIT_ACHSEN,
  type Beschaffenheit,
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

/** Die Zeile aus `vertreiber_kennwerte` (Spec 2026-10-13), roh wie aus D1. */
type RoheVertreiberKennwerte = { achsenMittel: unknown; restfeuchteMedian: number | null; anzahl: number };

/**
 * Achsen-Mittel des Vertreibers (JSON, Werte 0 bis 5, nicht auf halbe Stufen gerastet, deshalb
 * nicht über parseBeschaffenheit): nur bekannte Achsen mit endlicher Zahl im Bereich, auf eine
 * Stelle gerundet wie mittleBeschaffenheit. Kaputt oder leer ergibt ein leeres Objekt.
 */
export function parseAchsenMittel(roh: unknown): Beschaffenheit {
  let wert = roh;
  if (typeof wert === "string") {
    try {
      wert = JSON.parse(wert);
    } catch {
      return {};
    }
  }
  if (!wert || typeof wert !== "object" || Array.isArray(wert)) return {};
  const quelle = wert as Record<string, unknown>;
  const ergebnis: Beschaffenheit = {};
  for (const { key } of BESCHAFFENHEIT_ACHSEN) {
    const zahl = quelle[key];
    if (typeof zahl === "number" && Number.isFinite(zahl) && zahl >= 0 && zahl <= 5) ergebnis[key] = Math.round(zahl * 10) / 10;
  }
  return ergebnis;
}

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
  /**
   * Legendennamen der Serien in der Sprache der Seite (w.aroma.serien). `hersteller` wird
   * seit 2026-10-03 nicht mehr gelesen; der Schlüssel bleibt, damit die Aufrufer und das
   * Wörterbuch unverändert bleiben.
   */
  namen: { hersteller: string; community: string },
  kennwerte: RoheKennwerte | null = null,
  /**
   * Chargenqualität des Vertreibers (Spec 2026-10-13): das Charge-Fazit vergleicht mit dem
   * Vertreiber-Schnitt. Ohne Kennwerte oder ohne brauchbare Achsen bleibt das Mittel der Ware.
   */
  vertreiber: RoheVertreiberKennwerte | null = null,
) {
  const hersteller = herstellerProfil(terpene);
  const community = verdichteGeschmacksMatrix(reviews);
  const median = communityMedian(kennwerte);
  // Nur die Community-Reihe (Nutzer 2026-10-03): die Herstellerangabe ist keine Serie der Karte
  // mehr. Der Betreiber kennt die Geschmacksintensität der Herstellerangaben nicht, jede
  // Darstellung davon wäre erfunden. Was der Hersteller nennt, steht weiterhin in den Ebenen
  // (hersteller, ergaenzt, geist). Das ist eine Enthalten-Aussage, keine Intensitäts-Aussage.
  // Mit dem Median des Kultivars steht die Reihe auch für einen Handelsnamen ohne eigene Bewertung.
  const reihe = median?.geschmack ?? (community.anzahlBewertungen > 0 ? community.matrix : null);
  const serien: AromaSerie[] = reihe ? [{ name: namen.community, ton: "lila" as const, matrix: reihe }] : [];
  const vertreiberAchsen = vertreiber && vertreiber.anzahl > 0 ? parseAchsenMittel(vertreiber.achsenMittel) : {};
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
    beschaffenheit:
      vertreiber && Object.keys(vertreiberAchsen).length > 0
        ? { werte: vertreiberAchsen, feuchte: vertreiber.restfeuchteMedian, anzahl: vertreiber.anzahl }
        : mittleBeschaffenheit(
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
