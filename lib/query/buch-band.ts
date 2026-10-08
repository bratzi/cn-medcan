import { cache } from "react";

import type { KartenTerpen } from "@/lib/aromakarte";
import type { Prisma } from "@/lib/generated/prisma/client";
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

const SELECT = {
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
} as const satisfies Prisma.ReviewSelect;

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
    // id als letzte Ordnung: bei gleicher Zeit überlappen oder überspringen Bände sonst Einträge.
    orderBy: [{ istRedaktionell: "desc" }, { erstelltAm: "desc" }, { id: "asc" }],
    skip: (band - 1) * BAND_GROESSE,
    take: BAND_GROESSE,
    select: SELECT,
  });
  const autorZahlen = await ladeAutorZahlen(zeilen.flatMap((z) => (z.autorId ? [z.autorId] : [])));
  return {
    band,
    baende,
    gesamt,
    basis: (band - 1) * BAND_GROESSE,
    eintraege: zeilen.map((z) => alsBandEintrag(z, autorZahlen)),
  };
});

type Zeile = Prisma.ReviewGetPayload<{ select: typeof SELECT }>;

function alsBandEintrag(z: Zeile, autorZahlen: Awaited<ReturnType<typeof ladeAutorZahlen>>): BandEintrag {
  return {
    review: alsReviewEintrag(z, autorZahlen),
    produkt: {
      handelsname: z.strain.handelsname,
      slug: z.strain.slug,
      bildPfad: z.strain.herstellerBildPfad,
      terpene: z.strain.terpene.map(alsKartenTerpen),
    },
  };
}

/**
 * Die neueste freigegebene Bewertung des Betreibers für die Startseite, als Doppelseite wie im großen
 * Buch (Nutzer 2026-10-09: die Startseite zieht bei der Darstellung der Bewertungen immer mit).
 */
export const ladeNeuestenBetreiberEintrag = cache(async (): Promise<BandEintrag | null> => {
  const prisma = await getPrisma();
  const zeile = await prisma.review.findFirst({
    where: { ...WO, istRedaktionell: true },
    orderBy: [{ erstelltAm: "desc" }, { id: "asc" }],
    select: SELECT,
  });
  if (!zeile) return null;
  return alsBandEintrag(zeile, await ladeAutorZahlen(zeile.autorId ? [zeile.autorId] : []));
});
