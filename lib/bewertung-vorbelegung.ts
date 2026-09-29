/**
 * Vorbelegung der Bewertungsmaske (Masterplan Bewertung v2, T4, Nutzer
 * 2026-09-29): wer eine Sorte schon bewertet hat, sieht in der Blütenseite
 * seine gespeicherten Werte und überschreibt sie beim Speichern (upsert je
 * Mitglied und Sorte). Reine Funktion ohne Datenbank, die Gegenrichtung zu
 * lib/bewertung-eingabe.ts; die JSON-Spalten werden wie überall geprüft
 * gelesen, kaputte Zeilen ergeben leere Startwerte statt eines Fehlers.
 */
import { gesamtnoteGueltig } from "@/lib/bewertung-v2";
import {
  parseBeschaffenheit,
  parseGeschmacksMatrix,
  parseTerpenIntensitaet,
  type BeschaffenheitsKey,
  type BewertungsAchse,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";

/** Was aus D1 für die Vorbelegung gelesen wird. */
export type GespeicherteBewertung = {
  [K in BewertungsAchse]: number;
} & {
  gesamtnote: number | null;
  feuchtigkeitProzent: number | null;
  geschmacksMatrix: unknown;
  terpenIntensitaet: unknown;
  beschaffenheit: unknown;
  notiz: string | null;
  instagramReelUrl: string | null;
  charge: { chargenNr: string } | null;
  aktualisiertAm: Date;
};

export type Vorbelegung = {
  /** Zeitpunkt des letzten Speicherns; wechselt er, beginnt die Maske mit den neuen Werten. */
  stand: string;
  gesamtnote: number | null;
  noten: Record<BewertungsAchse, number>;
  geschmack: GeschmacksMatrix;
  intensitaet: Record<string, number>;
  /** Beschaffenheit je Achse und die Restfeuchte (Schlüssel `feuchte`), nur was gespeichert ist. */
  beschaffenheit: Partial<Record<BeschaffenheitsKey | "feuchte", number>>;
  chargenNr: string | null;
  notiz: string | null;
  instagramReelUrl: string | null;
};

export function vorbelegungAus(review: GespeicherteBewertung): Vorbelegung {
  return {
    stand: review.aktualisiertAm.toISOString(),
    gesamtnote: review.gesamtnote !== null && gesamtnoteGueltig(review.gesamtnote) ? review.gesamtnote : null,
    noten: {
      aussehen: review.aussehen,
      geruch: review.geruch,
      geschmack: review.geschmack,
      wirkung: review.wirkung,
      konsistenz: review.konsistenz,
    },
    geschmack: parseGeschmacksMatrix(review.geschmacksMatrix),
    intensitaet: parseTerpenIntensitaet(review.terpenIntensitaet),
    beschaffenheit: {
      ...parseBeschaffenheit(review.beschaffenheit),
      ...(review.feuchtigkeitProzent === null ? {} : { feuchte: review.feuchtigkeitProzent }),
    },
    chargenNr: review.charge?.chargenNr ?? null,
    notiz: review.notiz,
    instagramReelUrl: review.instagramReelUrl,
  };
}
