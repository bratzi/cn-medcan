import {
  parseGeschmacksMatrix,
  parseBeschaffenheit,
  parseTerpenIntensitaet,
  type GeschmacksMatrix,
  type Beschaffenheit,
  type TerpenIntensitaet,
} from "@/lib/query/bewertung";
import type { KartenTerpen } from "@/lib/aromakarte";
import type { ReviewBild, ReviewEintrag } from "@/lib/query/strains";

/** Was die Doppelseite braucht: eine Bewertung samt Produktname, Matrix geprueft. */
export type EintragDaten = {
  id: string;
  handelsname: string;
  slug: string;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  geschmacksMatrix: GeschmacksMatrix;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  chargenNr: string | null;
  erstelltAm: Date;
  /** Bewertung des Betreibers (istRedaktionell); sonst Community. */
  istBetreiber: boolean;
  /** Anzeigename des Autors; null ohne Autor (Seed, gelöschtes Mitglied). */
  autorName: string | null;
  /** Bild-Id des Profilbilds des Autors (T8); null oder fehlend ergibt Initialen. */
  autorAvatarId?: string | null;
  /** Freigegebene Bewertungen des Autors über alle Sorten; null oder fehlend ohne Zahl. */
  autorBewertungen?: number | null;
  /** Kurz-Id des öffentlichen Profils; null bei privatem Profil oder ohne Autor. */
  autorProfil?: string | null;
  /** Gesamtnote 0,5 bis 5 in Blättern (T4); null bei Altbewertungen. */
  gesamtnote: number | null;
  /** Terpene der Sorte für die Aroma-Karte (Bögen, Herstellerprofil). */
  terpene: KartenTerpen[];
  /** Sweet Spot je Terpen (1-5, 3 = Ziel), leer ohne Angabe. */
  terpenIntensitaet: TerpenIntensitaet;
  beschaffenheit: Beschaffenheit;
  /** Herstellerbild der Sorte (Symbolbild), wie in der Blütenübersicht. */
  bildPfad?: string | null;
  /** Freigegebene Bilder zur Bewertung (Spec 2026-10-06); leer: Ersatzbild ab lg. */
  bilder?: ReviewBild[];
};

/** Sprungziel des vollstaendigen Eintrags auf der Produktseite. */
export function eintragAnker(id: string): string {
  return `eintrag-${id}`;
}

export function eintragHref(slug: string, id: string): string {
  return `/blueten/${slug}#${eintragAnker(id)}`;
}

/**
 * Eine Bewertung der Produktseite als Eintrag: Name und Slug kommen vom
 * Produkt, die Matrix aus der JSON-Spalte wird geprueft (kaputt = neutral).
 */
export function alsEintrag(
  review: ReviewEintrag,
  produkt: { handelsname: string; slug: string; terpene?: KartenTerpen[]; bildPfad?: string | null },
): EintragDaten {
  return {
    id: review.id,
    handelsname: produkt.handelsname,
    slug: produkt.slug,
    aussehen: review.aussehen,
    geruch: review.geruch,
    geschmack: review.geschmack,
    wirkung: review.wirkung,
    konsistenz: review.konsistenz,
    geschmacksMatrix: parseGeschmacksMatrix(review.geschmacksMatrix),
    feuchtigkeitProzent: review.feuchtigkeitProzent,
    notiz: review.notiz,
    instagramReelUrl: review.instagramReelUrl,
    chargenNr: review.chargenNr,
    erstelltAm: review.erstelltAm,
    istBetreiber: review.istRedaktionell,
    autorName: review.autorName,
    autorAvatarId: review.autorAvatarId ?? null,
    autorBewertungen: review.autorBewertungen ?? null,
    autorProfil: review.autorProfil ?? null,
    gesamtnote: review.gesamtnote,
    terpene: produkt.terpene ?? [],
    terpenIntensitaet: parseTerpenIntensitaet(review.terpenIntensitaet),
    beschaffenheit: parseBeschaffenheit(review.beschaffenheit),
    bildPfad: produkt.bildPfad ?? null,
    bilder: review.bilder ?? [],
  };
}
