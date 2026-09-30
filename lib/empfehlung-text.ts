import { istGeschmacksKategorie } from "@/db/enums";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Gemeinsame Aromen einer Empfehlung als lesbare Liste (T11, Nutzer
 * 2026-09-29): „Myrcen, Limonen, zitrisch“. Terpene mit Anzeigenamen,
 * Geschmäcker als Adjektiv. Unbekannte Schlüssel entfallen. Nur Aroma (HWG).
 */
export function aromenText(schluessel: readonly string[], w: Woerterbuch, sprache: Sprache): string {
  const teile: string[] = [];
  for (const s of schluessel) {
    if (s.startsWith("t:") && s.length > 2) teile.push(terpenAnzeige(s.slice(2), sprache));
    else if (s.startsWith("g:")) {
      const kategorie = s.slice(2);
      if (istGeschmacksKategorie(kategorie)) teile.push(w.empfehlung.aromaAdjektiv[kategorie]);
    }
  }
  return teile.join(", ");
}

/** „weil dir X gefiel: gemeinsam …“; ohne gemeinsame Aromen leer. */
export function begruendungText(
  e: { bezugHandelsname: string; gemeinsam: readonly string[] },
  w: Woerterbuch,
  sprache: Sprache,
): string {
  const aromen = aromenText(e.gemeinsam, w, sprache);
  return aromen ? t(w.empfehlung.weil, { sorte: e.bezugHandelsname, aromen }) : "";
}
