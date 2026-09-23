/**
 * Community-Zahlen fuer die Wand der Startseite (Spec 5.3), ohne
 * Datenbankzugriff und ohne "server-only": die reine Zuordnung ist so
 * testbar. Die Abfrage selbst steht in lib/query/umfragen.ts.
 *
 * Bewusst nur Zaehler: Vorschlaege tragen Handelsnamen und unmoderierten
 * Freitext, beides gehoert nicht als Graffiti auf die Startseite (Spec 2).
 */

export type CommunityZahlen = {
  stimmen: number;
  vorschlaege: number;
  runden: number;
};

type Zeile = Partial<Record<keyof CommunityZahlen, unknown>>;

/** Die Leitsaetze der Wand, wenn es noch nichts zu zaehlen gibt (Spec 5.2). */
export const LEITSAETZE = ["Schlag vor.", "Stimm ab.", "Lies mit."] as const;

const ZAHL = new Intl.NumberFormat("de-DE");

/** D1 liefert COUNT je nach Adapter als number, bigint oder string. */
function alsZahl(wert: unknown): number {
  if (typeof wert === "bigint") return wert >= 0n ? Number(wert) : 0;
  if (typeof wert === "number") return Number.isFinite(wert) && wert >= 0 ? wert : 0;
  if (typeof wert === "string" && /^\d+$/.test(wert)) return Number(wert);
  return 0;
}

export function zuCommunityZahlen(zeilen: readonly Zeile[] | null | undefined): CommunityZahlen {
  const zeile = zeilen?.[0];
  return {
    stimmen: alsZahl(zeile?.stimmen),
    vorschlaege: alsZahl(zeile?.vorschlaege),
    runden: alsZahl(zeile?.runden),
  };
}

export function hatCommunityZahlen(zahlen: CommunityZahlen): boolean {
  return zahlen.stimmen + zahlen.vorschlaege + zahlen.runden > 0;
}

/** Die Tags der Wand: echte Zahlen, oder die Leitsaetze, wenn alles 0 ist oder die Abfrage fehlschlug. */
export function wandTags(zahlen: CommunityZahlen | null): string[] {
  if (!zahlen || !hatCommunityZahlen(zahlen)) return [...LEITSAETZE];
  return [
    `${ZAHL.format(zahlen.stimmen)} ${zahlen.stimmen === 1 ? "Stimme" : "Stimmen"}`,
    `${ZAHL.format(zahlen.vorschlaege)} ${zahlen.vorschlaege === 1 ? "Vorschlag" : "Vorschläge"}`,
    `${ZAHL.format(zahlen.runden)} ${zahlen.runden === 1 ? "Runde" : "Runden"}`,
  ];
}
