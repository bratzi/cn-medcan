import "server-only";

import { cache } from "react";

import { alsEintrag, type EintragDaten } from "@/components/review/eintrag";
import { getPrisma } from "@/lib/prisma";
import { ladeAutorZahlen } from "@/lib/query/autoren";
import { alsKartenTerpen, alsReviewEintrag, BEWERTUNG_SELECT } from "@/lib/query/strains";

/**
 * Die mit einem Jury-Beitrag verknüpfte Bewertung samt Terpenen der Sorte für den BewertungsBlock
 * (Terpz-Score, Gesamteindruck, Aroma-Karte). Nur freigegebene Bewertungen: sonst null, damit
 * nichts Unfreigegebenes über einen Beitrag nach außen geht.
 */
export const ladeJuryBewertung = cache(async (reviewId: string): Promise<EintragDaten | null> => {
  const prisma = await getPrisma();
  const z = await prisma.review.findFirst({
    where: { id: reviewId, freigegeben: true },
    select: {
      ...BEWERTUNG_SELECT,
      strain: {
        select: {
          handelsname: true,
          kultivar: { select: { name: true } },
          vertreiber: { select: { name: true } },
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
  if (!z) return null;
  const zahlen = await ladeAutorZahlen(z.autorId ? [z.autorId] : []);
  return alsEintrag(alsReviewEintrag(z, zahlen), {
    handelsname: z.strain.handelsname,
    bluete: z.strain.kultivar?.name ?? z.strain.handelsname,
    vertreiber: z.strain.vertreiber?.name ?? null,
    slug: z.strain.slug,
    bildPfad: z.strain.herstellerBildPfad,
    terpene: z.strain.terpene.map(alsKartenTerpen),
  });
});
