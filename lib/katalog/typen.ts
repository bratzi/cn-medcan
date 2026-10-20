import type { Darreichungsform, GeschmacksKategorie, KultivarTyp } from "@/db/enums";

/**
 * Wire-Format von GET /api/katalog (Spec 2026-10-20 Blütenseite). Kurze Schlüssel, weil ~700 Zeilen
 * über die Leitung gehen; nur in dieser Datei und in lib/katalog/laden.ts (SQL) ausgeschrieben.
 */
export type KatalogBestand = {
  /** Apotheken-Slug */ a: string;
  /** Status, z. B. "VERFUEGBAR" */ s: string;
  /** Preis je Gramm in Cent */ p: number | null;
};

export type KatalogWare = {
  i: string; // id
  s: string; // slug
  h: string; // handelsname
  k: string | null; // kultivarId
  y: KultivarTyp;
  f: Darreichungsform;
  g: string | null; // genetik
  t0: number; t1: number; // THC min/max %
  c0: number; c1: number; // CBD min/max %
  v: string | null; // vertreiberId
  b: string | null; // herstellerBildPfad
  /** Top-3-Terpennamen nach Rang */ tp: string[];
  /** Sichtbare Bestandszeilen (Fachkreis-Gate schon angewandt) */ st: KatalogBestand[];
  /** aktualisiertAm ISO, für "relevanz" */ u: string;
};

export type KatalogKultivar = {
  i: string;
  n: string; // name
  s: string | null; // slug
  /** Community-Mittel 1–5 oder null */ cn: number | null;
  /** Anzahl Community-Stimmen */ ca: number;
  /** Mittel der redaktionellen Gesamtnoten oder null */ en: number | null;
  /** Letzte Bewertung ISO oder null */ lb: string | null;
  /**
   * Geschmacks-Median der Community je Achse 0–5 (Schlüssel wie „suess“), null ohne Kennwerte.
   * Fehlt in Katalog-JSON von vor Task 2 (Browser-Cache bis 300 s): dann gelten alle als offen.
   */
  gm?: Record<string, number> | null;
};

export type KatalogDaten = {
  stand: string; // ISO-Zeit des Aufbaus
  fachkreis: boolean;
  waren: KatalogWare[];
  kultivare: KatalogKultivar[];
  vertreiber: { i: string; n: string }[];
  terpene: { n: string; g: GeschmacksKategorie }[];
  apotheken: { s: string; n: string }[];
};

/** Eine Zeile der Blüten-Ansicht, im Browser aus Waren verdichtet. */
export type BlueteZeile = {
  id: string;
  name: string;
  slug: string | null;
  typ: KultivarTyp;
  thcMin: number; thcMax: number;
  cbdMax: number;
  terpene: { name: string; geschmack: GeschmacksKategorie | null }[];
  vertreiberIds: string[];
  handelsnamen: number;
  community: { note: number; stimmen: number } | null;
  /** Geschmacks-Median der Community (KatalogKultivar.gm), null ohne Kennwerte. */
  geschmackMedian: Record<string, number> | null;
  eigeneNote: number | null;
  letzteBewertung: string | null;
  bildSlug: string | null;
  herstellerBildPfad: string | null;
  /** Kleingeschrieben, ohne Diakritika: Name, Handelsnamen, Genetik, Vertreiber */
  suchtext: string;
  waren: KatalogWare[];
};

/** Zeile der Strain-Ansicht: die Ware plus Kultivarwerte. */
export type StrainZeile = KatalogWare & {
  kultivarName: string | null;
  community: { note: number; stimmen: number } | null;
  /** Geschmacks-Median der Blüte, zu der der Strain gehört; null ohne Kennwerte. */
  geschmackMedian: Record<string, number> | null;
  eigeneNote: number | null;
  letzteBewertung: string | null;
  terpenGeschmack: (GeschmacksKategorie | null)[];
  suchtext: string;
};
