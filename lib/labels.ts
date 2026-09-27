import type {
  Bestrahlung,
  BestandStatus,
  Darreichungsform,
  GeschmacksKategorie,
  KultivarTyp,
  RezeptStatus,
  UnternehmensRolle,
} from "@/db/enums";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Anzeigetexte fuer alle Enum-Werte, je Sprache aus dem Woerterbuch
 * (Bereich `label`).
 *
 * Die Records sind ueber den Enum-Union-Typ indiziert: fehlt im Woerterbuch
 * ein Wert, bricht `tsc` hier. Neutrale Katalog-Formulierungen, keine
 * Werbesprache.
 */
export type Labels = {
  kultivarTyp: Record<KultivarTyp, string>;
  darreichungsform: Record<Darreichungsform, string>;
  bestrahlung: Record<Bestrahlung, string>;
  unternehmensRolle: Record<UnternehmensRolle, string>;
  rezeptStatus: Record<RezeptStatus, string>;
  bestandStatus: Record<BestandStatus, string>;
  /** Kurze Erlaeuterung zum Bestandsstatus, z. B. als Tooltip oder Hilfetext. */
  bestandStatusErlaeuterung: Record<BestandStatus, string>;
  geschmack: Record<GeschmacksKategorie, string>;
};

export function labels(w: Woerterbuch): Labels {
  return w.label;
}
