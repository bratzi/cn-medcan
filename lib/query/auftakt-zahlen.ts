import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { alsZahl } from "@/lib/query/community";

/**
 * Zahlen der Leiste im Auftakt (Spec 2026-10-08 Auftakt, 3), ohne
 * Datenbankzugriff und ohne "server-only": die reine Zuordnung ist so
 * testbar. Die Abfrage steht in lib/query/start-zahlen.ts.
 *
 * Bewusst nur Zähler, keine Namen und keine Freitexte (§ 10 HWG).
 */
export type AuftaktZahlen = {
  sorten: number;
  bewertungen: number;
  stimmen: number;
};

type Zeile = Partial<Record<keyof AuftaktZahlen, unknown>>;

export function zuAuftaktZahlen(zeilen: readonly Zeile[] | null | undefined): AuftaktZahlen {
  const zeile = zeilen?.[0];
  return {
    sorten: alsZahl(zeile?.sorten),
    bewertungen: alsZahl(zeile?.bewertungen),
    stimmen: alsZahl(zeile?.stimmen),
  };
}

/** Alles 0 heißt: noch nichts zu zeigen, die Leiste bleibt weg. */
export function hatAuftaktZahlen(zahlen: AuftaktZahlen): boolean {
  return zahlen.sorten + zahlen.bewertungen + zahlen.stimmen > 0;
}

/** Eine Zahl der Leiste: Wert, formatierter Endwert für das HTML, Wort darunter. */
export type AuftaktEintrag = { schluessel: keyof AuftaktZahlen; zahl: number; text: string; wort: string };

const REIHENFOLGE = ["sorten", "bewertungen", "stimmen"] as const;

export function auftaktEintraege(
  zahlen: AuftaktZahlen,
  texte: Woerterbuch["start"]["auftakt"]["zahlen"],
  sprache: Sprache,
): AuftaktEintrag[] {
  return REIHENFOLGE.map((schluessel) => ({
    schluessel,
    zahl: zahlen[schluessel],
    text: formatiereZahl(zahlen[schluessel], 0, sprache),
    wort: mehrzahl(sprache, texte[schluessel], zahlen[schluessel]),
  }));
}
