import { parseGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
import type { KartenTerpen } from "@/lib/aromakarte";
import type { ReviewEintrag } from "@/lib/query/strains";

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
  /** Terpene der Sorte für die Aroma-Karte (Bögen, Herstellerprofil). */
  terpene: KartenTerpen[];
};

/** Sprungziel des vollstaendigen Eintrags auf der Produktseite. */
export function eintragAnker(id: string): string {
  return `eintrag-${id}`;
}

export function eintragHref(slug: string, id: string): string {
  return `/produkte/${slug}#${eintragAnker(id)}`;
}

/**
 * Eine Bewertung der Produktseite als Eintrag: Name und Slug kommen vom
 * Produkt, die Matrix aus der JSON-Spalte wird geprueft (kaputt = neutral).
 */
export function alsEintrag(
  review: ReviewEintrag,
  produkt: { handelsname: string; slug: string; terpene?: KartenTerpen[] },
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
    terpene: produkt.terpene ?? [],
  };
}
