import type { GeschmacksKategorie } from "@/db/enums";

/**
 * Profilwerte eines Mitglieds (Spec Profil 4.2). Je Geschmacksachse -1..1,
 * normiert auf das stärkste |Gewicht|: positiv heißt „mag ich“, negativ
 * „mag ich nicht“. Nur Aroma, nie Wirkung (HWG).
 */
export type ProfilWerte = {
  geschmack: Record<GeschmacksKategorie, number>;
  /** Erst höchstens 8 positive (stärkste zuerst), dann höchstens 3 negative (stärkste Ablehnung zuerst). */
  terpene: { name: string; wert: number }[];
  /** Alle eigenen Bewertungen. */
  anzahl: number;
  /** Davon mit Gewicht ungleich 0 (ab 3,5 oder bis 2). */
  gewichtet: number;
};

/** Eine eigene Bewertung, wie die Auswertungen sie brauchen (Spec Profil 4.5). */
export type AuswertungsZeile = {
  slug: string;
  handelsname: string;
  erstelltAm: Date;
  gesamtnote: number | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  /** Fremde freigegebene Bewertungen der Sorte mit Gesamtnote (ohne die eigene); null ohne Abfrage. */
  community: { mittel: number | null; anzahl: number } | null;
};

export type BewertungsKurz = { slug: string; handelsname: string; note: number };

export type CommunityVergleich = {
  /** Mittel (eigene − Community), auf 0,1 gerundet; null unter 2 vergleichbaren Bewertungen. */
  differenz: number | null;
  vergleichbar: number;
  /** Höchstens 3, größte |Differenz| zuerst. */
  abweichungen: { slug: string; handelsname: string; eigene: number; community: number }[];
};

export type Schnitte = {
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  gesamt: number;
};

export type Auswertungen = {
  top: BewertungsKurz[];
  /** Schlechteste zuerst; leer bei 3 oder weniger Bewertungen. */
  flop: BewertungsKurz[];
  community: CommunityVergleich;
  /** null ohne Bewertung. */
  schnitte: Schnitte | null;
};
