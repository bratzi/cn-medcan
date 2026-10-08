import { cache } from "react";

import type { KartenTerpen } from "@/lib/aromakarte";
import { BAND_GROESSE, bandAnzahl } from "@/lib/buch";
import { getPrisma } from "@/lib/prisma";
import { ladeAutorZahlen } from "@/lib/query/autoren";
import { BEWERTUNG_SELECT, alsKartenTerpen, alsReviewEintrag, type ReviewEintrag } from "@/lib/query/strains";

export type BandEintrag = {
  review: ReviewEintrag;
  produkt: { handelsname: string; slug: string; terpene: KartenTerpen[]; bildPfad: string | null };
};
export type Band = { band: number; baende: number; gesamt: number; basis: number; eintraege: BandEintrag[] };

const WO = { freigegeben: true, strain: { aktiv: true } } as const;

/**
 * Ein Band des großen Buchs (Spec Bewertungsbuch 4): alle freigegebenen Bewertungen
 * aller aktiven Sorten, Betreiber zuerst, dann die Community, je neueste zuerst.
 */
export const ladeBand = cache(async (band: number): Promise<Band | null> => {
  const prisma = await getPrisma();
  const gesamt = await prisma.review.count({ where: WO });
  const baende = bandAnzahl(gesamt);
  if (!Number.isInteger(band) || band < 1 || band > baende) return null;
  const zeilen = await prisma.review.findMany({
    where: WO,
    orderBy: [{ istRedaktionell: "desc" }, { erstelltAm: "desc" }],
    skip: (band - 1) * BAND_GROESSE,
    take: BAND_GROESSE,
    select: {
      ...BEWERTUNG_SELECT,
      strain: {
        select: {
          handelsname: true,
          slug: true,
          herstellerBildPfad: true,
          terpene: {
            orderBy: { rang: "asc" },
            select: { rang: true, konzentrationProzent: true, terpen: { select: { name: true, geschmack: true } } },
          },
        },
      },
    },
  });
  const autorZahlen = await ladeAutorZahlen(zeilen.flatMap((z) => (z.autorId ? [z.autorId] : [])));
  return {
    band,
    baende,
    gesamt,
    basis: (band - 1) * BAND_GROESSE,
    eintraege: zeilen.map((z) => ({
      review: alsReviewEintrag(z, autorZahlen),
      produkt: {
        handelsname: z.strain.handelsname,
        slug: z.strain.slug,
        bildPfad: z.strain.herstellerBildPfad,
        terpene: z.strain.terpene.map(alsKartenTerpen),
      },
    })),
  };
});
