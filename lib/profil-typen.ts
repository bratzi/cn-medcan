import type { GeschmacksKategorie } from "@/db/enums";
import type { TerpenNetz } from "@/lib/terpen-achsen";

/**
 * Profilwerte eines Mitglieds (Spec Profil 4.2). Je Geschmacksachse -1..1,
 * normiert auf das stärkste |Gewicht|: positiv heißt „mag ich“, negativ
 * „mag ich nicht“. Nur Aroma, nie Wirkung (HWG).
 */
export type ProfilWerte = {
  geschmack: Record<GeschmacksKategorie, number>;
  /** Zehn feste Terpen-Achsen (lib/terpen-achsen), −1..1 auf das stärkste |Gewicht| normiert (Spec 2026-10-09). */
  terpenNetz: TerpenNetz;
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

/** Eine eigene Bewertung für das Register (Spec Profil und Konto 6): mit Bild und Hersteller. */
export type RegisterZeile = AuswertungsZeile & {
  strainId: string;
  hersteller: string | null;
  /** `strains.hersteller_bild_pfad`, für `ersatzBildId`. */
  bildPfad: string | null;
  /** Dein erstes Bild zu dieser Bewertung (offen oder freigegeben), sonst null. */
  eigenesBild: { id: string; breite: number; hoehe: number; offen: boolean } | null;
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

/** Geschmacksachsen −1..1, normiert auf das stärkste |Gewicht| (wie ProfilWerte.geschmack). */
export type Geschmack = Record<GeschmacksKategorie, number>;

/** Ein Schritt im Verlauf des Netzes (Spec Profil 10): das Netz nach den ersten `anzahl` Bewertungen. */
export type VerlaufSchritt = { anzahl: number; datum: string; geschmack: Geschmack; terpene?: TerpenNetz };

/** Veränderung einer Achse zwischen zwei Ständen; positiv heißt „stärker gemocht“. */
export type NetzAenderung = { achse: GeschmacksKategorie; differenz: number };

/** Ein Hersteller mit eigenen Bewertungen (Spec 2026-10-09 C): Id für den Katalogfilter, Mittel und Anzahl. */
export type HerstellerRang = { id: string; name: string; mittel: number; anzahl: number };
