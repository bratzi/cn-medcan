import { z } from "zod";

import type { GeschmacksKategorie } from "@/db/enums";

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
 * Die zehn Geschmacksachsen (seit 2026-09-26 mit Fruchtig und Minzig), in der
 * Reihenfolge eines Aromarads: benachbarte Noten liegen nebeneinander, damit
 * sich die Bögen der Karte wenig kreuzen. Diesel steht am Ende, weil es aus
 * Schwefelverbindungen kommt, nicht aus Terpenen. Bewusst identisch zum Enum
 * `GeschmacksKategorie`, damit Filter, Terpen-Map und Bewertungsmatrix
 * dieselben Kategorien teilen.
 */
export const GESCHMACKS_ACHSEN = [
  { key: "zitrus", label: "Zitrus", enumWert: "ZITRUS" },
  { key: "fruchtig", label: "Fruchtig", enumWert: "FRUCHTIG" },
  { key: "suess", label: "Süß", enumWert: "SUESS" },
  { key: "blumig", label: "Blumig", enumWert: "BLUMIG" },
  { key: "kraeutrig", label: "Kräutrig", enumWert: "KRAEUTRIG" },
  { key: "minzig", label: "Minzig", enumWert: "MINZIG" },
  { key: "holzig", label: "Holzig", enumWert: "HOLZIG" },
  { key: "wuerzig", label: "Würzig", enumWert: "WUERZIG" },
  { key: "erdig", label: "Erdig", enumWert: "ERDIG" },
  { key: "diesel", label: "Diesel", enumWert: "DIESEL" },
] as const satisfies readonly {
  key: string;
  label: string;
  enumWert: GeschmacksKategorie;
}[];

export type GeschmacksAchse = (typeof GESCHMACKS_ACHSEN)[number]["key"];

const achsenWert = z.number().min(0).max(5);

/**
 * Die Spalte `geschmacksMatrix` ist auf D1 ein JSON-TEXT - SQLite hat keinen
 * Json-Typ. Prisma gibt also einen String heraus und garantiert weder, dass
 * er sich parsen laesst, noch welche Struktur er hat. Deshalb muss beim
 * Lesen validiert werden, nicht nur beim Schreiben.
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
  // Seit 2026-09-26; ältere Bewertungen haben sie nicht und lesen sich mit 0.
  fruchtig: achsenWert.default(0),
  minzig: achsenWert.default(0),
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
    fruchtig: 0,
    minzig: 0,
  };
}

/**
 * Liest die Matrix aus der Json-Spalte. Bei ungueltigen Daten kommt eine
 * Matrix mit Nullwerten zurueck statt eines Fehlers: eine einzelne kaputte
 * Bewertungszeile (Altdaten, fehlgeschlagener Import) darf die Detailseite
 * nicht zerstoeren.
 */
export function parseGeschmacksMatrix(roh: unknown): GeschmacksMatrix {
  const ergebnis = geschmacksMatrixSchema.safeParse(entpacke(roh));
  return ergebnis.success ? ergebnis.data : leereGeschmacksMatrix();
}

/**
 * Holt das Objekt aus der Spalte. Auf D1 kommt ein String an, der erst
 * geparst werden muss; ein bereits geparstes Objekt (Testdaten, spaeter
 * vielleicht wieder ein echter Json-Typ) wird unveraendert durchgereicht.
 * Ein kaputter String fuehrt zu `undefined` und damit weiter unten zum
 * neutralen Fallback, nicht zu einer geworfenen Ausnahme.
 */
function entpacke(roh: unknown): unknown {
  if (typeof roh !== "string") return roh;
  try {
    return JSON.parse(roh);
  } catch {
    return undefined;
  }
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
    const ergebnis = geschmacksMatrixSchema.safeParse(
      entpacke(review.geschmacksMatrix)
    );
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

type TeilbareBewertung = NotenQuelle & { istRedaktionell: boolean; erstelltAm: Date };

export type GeteilteBewertungen<T> = {
  eigene: T[];
  community: T[];
  /** Gesamtnote der neuesten eigenen Bewertung, sonst null. */
  meineNote: number | null;
  /** Mittel der Gesamtnoten der Community, sonst null. */
  communityMittel: number | null;
};

/**
 * Trennt die Stimme des Betreibers von der Community (Spec TP2 4.4). Beide
 * Listen neueste zuerst. "Meine Note" ist die Gesamtnote der neuesten
 * eigenen Bewertung und bewusst kein Mittel: eine aeltere Charge soll die
 * neueste Aussage nicht verwaessern, und die Community mischt nicht mit.
 */
export function teileBewertungen<T extends TeilbareBewertung>(
  reviews: readonly T[],
): GeteilteBewertungen<T> {
  const neuesteZuerst = [...reviews].sort((a, b) => b.erstelltAm.getTime() - a.erstelltAm.getTime());
  const eigene = neuesteZuerst.filter((review) => review.istRedaktionell);
  const community = neuesteZuerst.filter((review) => !review.istRedaktionell);

  const communityMittel =
    community.length > 0
      ? Math.round(
          (community.reduce((summe, review) => summe + berechneGesamtnote(review), 0) / community.length) * 10,
        ) / 10
      : null;

  return {
    eigene,
    community,
    meineNote: eigene.length > 0 ? berechneGesamtnote(eigene[0]) : null,
    communityMittel,
  };
}

// ---------------------------------------------------------------------------
//  Terpen-Intensitaet (Spec Redesign 15)
// ---------------------------------------------------------------------------

/** Die Stufen der Sweet-Spot-Skala. 3 ist das Ziel, nicht 5. */
export const INTENSITAETS_STUFEN = [
  { wert: 1, label: "zu schwach" },
  { wert: 2, label: "etwas schwach" },
  { wert: 3, label: "Sweet Spot" },
  { wert: 4, label: "etwas stark" },
  { wert: 5, label: "zu stark" },
] as const;

export const terpenIntensitaetSchema = z.record(z.string().min(1), z.number().int().min(0).max(5));

export type TerpenIntensitaet = z.infer<typeof terpenIntensitaetSchema>;

/**
 * Beschaffenheit der Blüte, je 0 bis 5 in halben Schritten, mehr ist besser.
 * Die Restfeuchte steht getrennt in Prozent (feuchtigkeitProzent).
 */
export const BESCHAFFENHEIT_ACHSEN = [
  { key: "chlorophyll", label: "Chlorophyll", links: "grasig", rechts: "sauber", hinweis: "Wie wenig Chlorophyll man schmeckt: grasig oder sauber ausgehärtet." },
  { key: "budDichte", label: "Bud-Dichte", links: "weich", rechts: "fest", hinweis: "Wie fest die Blüte ist: weich und luftig oder dicht und hart." },
  { key: "terpenDichte", label: "Terpendichte", links: "wenig", rechts: "viel", hinweis: "Wie dicht das Aroma sitzt: kaum Duft oder satt beim Öffnen." },
  { key: "trichomFarbe", label: "Trichomfarbe", links: "klar", rechts: "bernstein", hinweis: "Reife der Trichome: klar, milchig, bernstein." },
] as const;

export type BeschaffenheitsKey = (typeof BESCHAFFENHEIT_ACHSEN)[number]["key"];

export const beschaffenheitSchema = z.record(z.string().min(1), z.number().min(0).max(5).multipleOf(0.5));

export type Beschaffenheit = Partial<Record<BeschaffenheitsKey, number>>;

/** Liest die JSON-Spalte; nur bekannte Achsen, kaputt ergibt ein leeres Objekt. */
export function parseBeschaffenheit(roh: unknown): Beschaffenheit {
  if (roh === null || roh === undefined) return {};
  const ergebnis = beschaffenheitSchema.safeParse(entpacke(roh));
  if (!ergebnis.success) return {};
  const bekannt = new Set<string>(BESCHAFFENHEIT_ACHSEN.map((achse) => achse.key));
  return Object.fromEntries(Object.entries(ergebnis.data).filter(([key]) => bekannt.has(key))) as Beschaffenheit;
}

/** Liest die JSON-Spalte; leer, fehlend oder kaputt ergibt ein leeres Objekt. */
export function parseTerpenIntensitaet(roh: unknown): TerpenIntensitaet {
  if (roh === null || roh === undefined) return {};
  const ergebnis = terpenIntensitaetSchema.safeParse(entpacke(roh));
  return ergebnis.success ? ergebnis.data : {};
}

/** Mittel je Terpen über mehrere Bewertungen, eine Nachkommastelle. */
export function mittleTerpenIntensitaet(alle: readonly TerpenIntensitaet[]): Record<string, { mittel: number; anzahl: number }> {
  const summen = new Map<string, { summe: number; anzahl: number }>();
  for (const eintrag of alle) {
    for (const [name, wert] of Object.entries(eintrag)) {
      const bisher = summen.get(name) ?? { summe: 0, anzahl: 0 };
      summen.set(name, { summe: bisher.summe + wert, anzahl: bisher.anzahl + 1 });
    }
  }
  return Object.fromEntries(
    [...summen].map(([name, { summe, anzahl }]) => [name, { mittel: Math.round((summe / anzahl) * 10) / 10, anzahl }]),
  );
}
