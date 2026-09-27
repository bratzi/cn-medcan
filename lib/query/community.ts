import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
/**
 * Community-Zahlen für die Randspalte der Startseite (Spec 5.3, Spec TP3
 * 8.3), ohne Datenbankzugriff und ohne "server-only": die reine Zuordnung
 * ist so testbar. Die Abfrage selbst steht in lib/query/umfragen.ts.
 *
 * Bewusst nur Zähler: Vorschläge tragen Handelsnamen und unmoderierten
 * Freitext, beides gehört nicht in Handschrift auf die Startseite
 * (Leitplanke 4).
 */

export type CommunityZahlen = {
  stimmen: number;
  vorschlaege: number;
  runden: number;
};

type Zeile = Partial<Record<keyof CommunityZahlen, unknown>>;

/** Eine Randnotiz: Zahl gedruckt, Wort von Hand. Ohne Zahl ist sie ein Leitsatz. */
export type Randnotiz = { zahl: number | null; wort: string };

/** Die Leitsätze der Randspalte, wenn es noch nichts zu zählen gibt (Spec 5.2). */
/** Schluessel der Leitsaetze im Woerterbuch (start.wissen.leitsaetze), in dieser Reihenfolge. */
export const LEITSAETZE = ["schlagVor", "stimmAb", "liesMit"] as const;

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

/**
 * Die Notizen der Randspalte: Zahl und Wort getrennt, Einzahl bei 1
 * (Spec TP3 12). Die Leitsätze, wenn alles 0 ist oder die Abfrage
 * fehlschlug.
 */
export function randnotizen(zahlen: CommunityZahlen | null, texte: Woerterbuch["start"]["wissen"], sprache: Sprache): Randnotiz[] {
  if (!zahlen || !hatCommunityZahlen(zahlen)) return LEITSAETZE.map((schluessel) => ({ zahl: null, wort: texte.leitsaetze[schluessel] }));
  return [
    { zahl: zahlen.stimmen, wort: mehrzahl(sprache, texte.stimmen, zahlen.stimmen) },
    { zahl: zahlen.vorschlaege, wort: mehrzahl(sprache, texte.vorschlaege, zahlen.vorschlaege) },
    { zahl: zahlen.runden, wort: mehrzahl(sprache, texte.runden, zahlen.runden) },
  ];
}
