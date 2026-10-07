import { GESCHMACKS_KATEGORIEN, type GeschmacksKategorie } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Geschmack, NetzAenderung } from "@/lib/profil-typen";

/**
 * Veränderung des Netzes zwischen zwei Ständen (Spec Profil 2.12): die Achsen
 * mit der größten Differenz, für Änderungszeile und Mini-Netz. Kleine
 * Schwankungen unter 0,05 zählen nicht; nur Aroma, nie Wirkung (HWG).
 */
export const AENDERUNG_SCHWELLE = 0.05;

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;

export function netzAenderung(vorher: Geschmack, nachher: Geschmack, hoechstens = 2): NetzAenderung[] {
  return GESCHMACKS_KATEGORIEN.map((achse) => ({ achse, differenz: zwei((nachher[achse] ?? 0) - (vorher[achse] ?? 0)) }))
    .filter((a) => Math.abs(a.differenz) >= AENDERUNG_SCHWELLE)
    .sort(
      (a, b) =>
        Math.abs(b.differenz) - Math.abs(a.differenz) ||
        GESCHMACKS_KATEGORIEN.indexOf(a.achse) - GESCHMACKS_KATEGORIEN.indexOf(b.achse),
    )
    .slice(0, hoechstens);
}

/** „Fruchtig stärker, Erdig schwächer“ in der Sprache der Seite. */
export function aenderungsListe(
  liste: readonly NetzAenderung[],
  achsen: Record<GeschmacksKategorie, string>,
  texte: { staerker: string; schwaecher: string },
): string {
  return liste.map((a) => t(a.differenz > 0 ? texte.staerker : texte.schwaecher, { achse: achsen[a.achse] })).join(", ");
}
