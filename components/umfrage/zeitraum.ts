import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Zeitraum einer Runde in Worten, ohne Gedankenstrich (Spec TP2 4.2). */
export function rundenZeitraum(
  start: Date,
  ende: Date | null,
  texte: Woerterbuch["umfrage"]["zeitraum"],
  sprache: Sprache,
): string {
  return ende
    ? t(texte.von, { start: formatiereDatum(start, sprache), ende: formatiereDatum(ende, sprache) })
    : t(texte.seit, { start: formatiereDatum(start, sprache) });
}
