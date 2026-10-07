/**
 * Reine Aufbereitung der Budpics fuer die Anzeige (T9): ohne Datenbank und
 * Sitzung, damit Komponenten und Tests sie ohne Server laden koennen.
 */
import type { DiashowBild } from "@/components/produkt/BudpicDiashow";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { BudpicAnzeige } from "@/lib/query/budpics";
import type { ReviewBild } from "@/lib/query/strains";

/** Bilder fuer die Diashow samt fertigem Tooltip "Von Name, Datum". */
export function alsDiashow(liste: readonly BudpicAnzeige[], w: Woerterbuch, sprache: Sprache): DiashowBild[] {
  return liste.map((b) => ({
    id: b.id,
    breite: b.breite,
    hoehe: b.hoehe,
    beschriftung: t(w.budpic.von, { nutzer: b.nutzer, datum: formatiereDatum(b.erstelltAm, sprache) }),
  }));
}

const MELDUNGEN = [
  "bild.keinBild",
  "bild.format",
  "bild.eingabeGross",
  "bild.zuGross",
  "bild.masse",
  "budpic.nurFreigeschaltet",
  "budpic.fehlgeschlagen",
  "vorschlag.zuVieleBilder",
] as const;

/** Die Meldungen, die der Upload im Browser braucht: klein, damit die Karten leicht bleiben. */
export function budpicMeldungen(w: Woerterbuch): Record<string, string> {
  return Object.fromEntries(MELDUNGEN.map((k) => [k, w.meldung[k]]));
}

/** Bilder einer Bewertung für das Buch: Beschriftung nur das Datum, der Name steht im Kopf der Seite. */
export function alsBuchBilder(liste: readonly ReviewBild[], sprache: Sprache): DiashowBild[] {
  return liste.map((b) => ({ id: b.id, breite: b.breite, hoehe: b.hoehe, beschriftung: formatiereDatum(b.erstelltAm, sprache) }));
}
