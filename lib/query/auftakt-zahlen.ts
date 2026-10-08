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
