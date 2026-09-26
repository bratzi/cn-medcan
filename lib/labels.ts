import type {
  Bestrahlung,
  BestandStatus,
  Darreichungsform,
  GeschmacksKategorie,
  KultivarTyp,
  RezeptStatus,
  UnternehmensRolle,
} from "@/db/enums";

/**
 * Deutsche Anzeigetexte fuer alle Enum-Werte.
 *
 * Die Records sind ueber den Enum-Union-Typ indiziert: fehlt ein Wert,
 * bricht `tsc`. Neutrale Katalog-Formulierungen, keine Werbesprache.
 */

export const kultivarTypLabel: Record<KultivarTyp, string> = {
  INDICA: "Indica",
  SATIVA: "Sativa",
  HYBRID: "Hybrid",
  RUDERALIS: "Ruderalis",
};

export const darreichungsformLabel: Record<Darreichungsform, string> = {
  BLUETE: "Blüte",
  EXTRAKT: "Extrakt",
  GRANULAT: "Granulat",
};

export const bestrahlungLabel: Record<Bestrahlung, string> = {
  GAMMA: "Gamma-bestrahlt",
  E_BEAM: "E-Beam-bestrahlt",
  UNBESTRAHLT: "Unbestrahlt",
  UNBEKANNT: "Bestrahlung unbekannt",
};

export const unternehmensRolleLabel: Record<UnternehmensRolle, string> = {
  HERSTELLER: "Hersteller",
  IMPORTEUR: "Importeur",
  BEIDES: "Hersteller und Importeur",
};

export const rezeptStatusLabel: Record<RezeptStatus, string> = {
  E_REZEPT_ONLY: "Nur E-Rezept",
  PAPIER_ONLY: "Nur Papierrezept",
  BEIDES: "E-Rezept und Papierrezept",
};

export const bestandStatusLabel: Record<BestandStatus, string> = {
  VERFUEGBAR: "Verfügbar",
  NACHBESTELLT: "Nachbestellt",
  NICHT_LIEFERBAR: "Nicht lieferbar",
  AUSGELISTET: "Ausgelistet",
};

/** Kurze Erlaeuterung zum Bestandsstatus, z. B. als Tooltip oder Hilfetext. */
export const bestandStatusErlaeuterung: Record<BestandStatus, string> = {
  VERFUEGBAR: "Von der Apotheke als vorrätig gemeldet.",
  NACHBESTELLT: "Derzeit nicht vorrätig, aber bei der Apotheke bestellt.",
  NICHT_LIEFERBAR: "Aktuell nicht beziehbar, der Artikel bleibt im Katalog.",
  AUSGELISTET: "Wird von dieser Apotheke nicht mehr geführt.",
};

export const geschmacksKategorieLabel: Record<GeschmacksKategorie, string> = {
  DIESEL: "Diesel",
  ZITRUS: "Zitrus",
  ERDIG: "Erdig",
  SUESS: "Süß",
  WUERZIG: "Würzig",
  BLUMIG: "Blumig",
  HOLZIG: "Holzig",
  KRAEUTRIG: "Kräutrig",
  FRUCHTIG: "Fruchtig",
  MINZIG: "Minzig",
};
