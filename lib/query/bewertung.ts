import { z } from "zod";

import type { GeschmacksKategorie } from "@/lib/generated/prisma/enums";

/** Die fuenf Noten-Achsen des festen Bewertungsschemas (jeweils 1-5). */
export const BEWERTUNGS_ACHSEN = [
  {
    key: "aussehen",
    label: "Aussehen",
    erlaeuterung: "Trichombesatz, Blütenstruktur, Farbe und Trimmqualität.",
  },
  {
    key: "geruch",
    label: "Geruch",
    erlaeuterung: "Intensität und Klarheit des Aromas beim Öffnen des Gefäßes.",
  },
  {
    key: "geschmack",
    label: "Geschmack",
    erlaeuterung: "Aroma bei der Anwendung, inklusive Nachgeschmack.",
  },
  {
    key: "wirkung",
    label: "Wirkung",
    erlaeuterung: "Eintritt, Dauer und Verlässlichkeit der Wirkung.",
  },
  {
    key: "konsistenz",
    label: "Konsistenz",
    erlaeuterung: "Griffigkeit und Restfeuchte - weder staubig noch klamm.",
  },
] as const;

export type BewertungsAchse = (typeof BEWERTUNGS_ACHSEN)[number]["key"];

/**
 * Die acht Geschmacksachsen. Bewusst identisch zum Enum
 * `GeschmacksKategorie`, damit Filter, Terpen-Map und Bewertungsmatrix
 * dieselben Kategorien teilen.
 */
export const GESCHMACKS_ACHSEN = [
  { key: "diesel", label: "Diesel", enumWert: "DIESEL" },
  { key: "zitrus", label: "Zitrus", enumWert: "ZITRUS" },
  { key: "erdig", label: "Erdig", enumWert: "ERDIG" },
  { key: "suess", label: "Süß", enumWert: "SUESS" },
  { key: "wuerzig", label: "Würzig", enumWert: "WUERZIG" },
  { key: "blumig", label: "Blumig", enumWert: "BLUMIG" },
  { key: "holzig", label: "Holzig", enumWert: "HOLZIG" },
  { key: "kraeutrig", label: "Kräutrig", enumWert: "KRAEUTRIG" },
] as const satisfies readonly {
  key: string;
  label: string;
  enumWert: GeschmacksKategorie;
}[];

export type GeschmacksAchse = (typeof GESCHMACKS_ACHSEN)[number]["key"];

const achsenWert = z.number().min(0).max(5);

/**
 * Die Spalte `geschmacksMatrix` ist `Json` - Prisma gibt dafuer `unknown`
 * heraus und garantiert keine Struktur. Deshalb muss beim Lesen validiert
 * werden, nicht nur beim Schreiben.
 */
export const geschmacksMatrixSchema = z.object({
  diesel: achsenWert,
  zitrus: achsenWert,
  erdig: achsenWert,
  suess: achsenWert,
  wuerzig: achsenWert,
  blumig: achsenWert,
  holzig: achsenWert,
  kraeutrig: achsenWert,
});

export type GeschmacksMatrix = z.infer<typeof geschmacksMatrixSchema>;

/** Matrix mit Nullwerten - der neutrale Fallback. */
export function leereGeschmacksMatrix(): GeschmacksMatrix {
  return {
    diesel: 0,
    zitrus: 0,
    erdig: 0,
    suess: 0,
    wuerzig: 0,
    blumig: 0,
    holzig: 0,
    kraeutrig: 0,
  };
}

/**
 * Liest die Matrix aus der Json-Spalte. Bei ungueltigen Daten kommt eine
 * Matrix mit Nullwerten zurueck statt eines Fehlers: eine einzelne kaputte
 * Bewertungszeile (Altdaten, fehlgeschlagener Import) darf die Detailseite
 * nicht zerstoeren.
 */
export function parseGeschmacksMatrix(json: unknown): GeschmacksMatrix {
  const ergebnis = geschmacksMatrixSchema.safeParse(json);
  return ergebnis.success ? ergebnis.data : leereGeschmacksMatrix();
}

type NotenQuelle = {
  [K in BewertungsAchse]: number;
};

/** Mittel der fuenf Noten, auf eine Dezimalstelle gerundet. */
export function berechneGesamtnote(review: NotenQuelle): number {
  const summe = BEWERTUNGS_ACHSEN.reduce(
    (akku, achse) => akku + review[achse.key],
    0
  );
  return Math.round((summe / BEWERTUNGS_ACHSEN.length) * 10) / 10;
}

export type VerdichteteGeschmacksMatrix = {
  matrix: GeschmacksMatrix;
  anzahlBewertungen: number;
};

/**
 * Durchschnitt je Geschmacksachse ueber mehrere Bewertungen - Datenbasis der
 * Terpen-Map auf der Detailseite. Die Zahl der einbezogenen Bewertungen kommt
 * mit zurueck, damit die UI "Durchschnitt aus n Bewertungen" anzeigen kann.
 */
export function verdichteGeschmacksMatrix(
  reviews: readonly { geschmacksMatrix: unknown }[]
): VerdichteteGeschmacksMatrix {
  const summen = leereGeschmacksMatrix();
  let anzahl = 0;

  for (const review of reviews) {
    const ergebnis = geschmacksMatrixSchema.safeParse(review.geschmacksMatrix);
    // Ungueltige Zeilen fliessen nicht in den Durchschnitt ein, statt ihn
    // mit Nullen zu verwaessern.
    if (!ergebnis.success) continue;
    anzahl += 1;
    for (const achse of GESCHMACKS_ACHSEN) {
      summen[achse.key] += ergebnis.data[achse.key];
    }
  }

  if (anzahl === 0) {
    return { matrix: leereGeschmacksMatrix(), anzahlBewertungen: 0 };
  }

  const matrix = leereGeschmacksMatrix();
  for (const achse of GESCHMACKS_ACHSEN) {
    matrix[achse.key] = Math.round((summen[achse.key] / anzahl) * 10) / 10;
  }
  return { matrix, anzahlBewertungen: anzahl };
}

export type FeuchtigkeitsEinordnung =
  | "zu_trocken"
  | "optimal"
  | "zu_feucht"
  | "unbekannt";

export type Feuchtigkeitsbefund = {
  einordnung: FeuchtigkeitsEinordnung;
  hinweis: string;
};

/**
 * Ordnet die Restfeuchte ein. Grenzen: unter 8 % zu trocken,
 * 8-13 % optimal, ueber 13 % Schimmelrisiko.
 */
export function bewerteFeuchtigkeit(
  prozent: number | null | undefined
): Feuchtigkeitsbefund {
  if (prozent === null || prozent === undefined || !Number.isFinite(prozent)) {
    return {
      einordnung: "unbekannt",
      hinweis: "Keine Angabe zur Restfeuchte vorhanden.",
    };
  }
  if (prozent < 8) {
    return {
      einordnung: "zu_trocken",
      hinweis:
        "Unter 8 % Restfeuchte: Blüten zerfallen leicht, Terpene sind teils verflogen.",
    };
  }
  if (prozent <= 13) {
    return {
      einordnung: "optimal",
      hinweis: "8 bis 13 % Restfeuchte gelten als optimaler Bereich.",
    };
  }
  return {
    einordnung: "zu_feucht",
    hinweis: "Über 13 % Restfeuchte: erhöhtes Schimmelrisiko bei Lagerung.",
  };
}
