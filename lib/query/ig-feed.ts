import "server-only";

import type { GeschmacksKategorie } from "@/db/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { igReview, type IgReview } from "@/lib/ig-feed";
import { liebsteAromen } from "@/lib/profil-ansicht";
import { getPrisma } from "@/lib/prisma";
import { GESCHMACKS_ACHSEN, parseGeschmacksMatrix } from "@/lib/query/bewertung";
import { beendeteRundenMitGewinnern } from "@/lib/query/umfragen";

export type IgUmfrage = { id: string; titel: string; beendetAm: string | null; gewinner: Array<{ bluete: string; stimmen: number }>; url: string };

/** Matrix (Achsenschlüssel) auf Kategorien-Enum abbilden, damit `liebsteAromen` sie lesen kann. */
function aromenWerte(roh: string): Record<GeschmacksKategorie, number> {
  const matrix = parseGeschmacksMatrix(roh);
  return Object.fromEntries(GESCHMACKS_ACHSEN.map((a) => [a.enumWert, matrix[a.key]])) as Record<GeschmacksKategorie, number>;
}

const REVIEW_AUSWAHL = {
  id: true,
  gesamtnote: true,
  notiz: true,
  geschmacksMatrix: true,
  erstelltAm: true,
  freigegeben: true,
  istRedaktionell: true,
  strain: { select: { slug: true, handelsname: true, vertreiber: { select: { name: true } } } },
  wareGenau: true,
  vertreiberId: true,
  vertreiber: { select: { name: true } },
  kultivar: { select: { name: true, slug: true } },
  charge: { select: { chargenNr: true } },
  bilder: { where: { status: "FREIGEGEBEN" }, select: { id: true, status: true }, take: 10 },
} satisfies Prisma.ReviewSelect;

type ReviewZeile = Prisma.ReviewGetPayload<{ select: typeof REVIEW_AUSWAHL }>;

function alsIgReview(z: ReviewZeile, ursprung: string): IgReview | null {
  return igReview(
    {
      id: z.id,
      slug: z.strain.slug,
      handelsname: z.strain.handelsname,
      vertreiber: z.vertreiber?.name ?? z.strain.vertreiber?.name ?? null,
      sorte: z.kultivar?.slug ? { name: z.kultivar.name, slug: z.kultivar.slug, vertreiberId: z.vertreiberId, wareGenau: z.wareGenau } : null,
      charge: z.charge?.chargenNr ?? null,
      gesamtnote: z.gesamtnote,
      aromen: liebsteAromen(aromenWerte(z.geschmacksMatrix), 2),
      notiz: z.notiz,
      bilder: z.bilder,
      erstelltAm: z.erstelltAm,
      freigegeben: z.freigegeben,
      istRedaktionell: z.istRedaktionell,
    },
    ursprung,
  );
}

/** Letzte zehn freigegebene Betreiber-Reviews, nur öffentliche Felder. */
export async function igReviews(ursprung: string): Promise<IgReview[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { freigegeben: true, istRedaktionell: true },
    orderBy: { erstelltAm: "desc" },
    take: 10,
    select: REVIEW_AUSWAHL,
  });
  return zeilen.map((z) => alsIgReview(z, ursprung)).filter((r): r is IgReview => r !== null);
}

/** Eine freigegebene Betreiber-Review für die Instagram-Karte; sonst null. */
export async function igReviewEinzeln(id: string, ursprung: string): Promise<IgReview | null> {
  const prisma = await getPrisma();
  const z = await prisma.review.findUnique({ where: { id }, select: REVIEW_AUSWAHL });
  return z ? alsIgReview(z, ursprung) : null;
}

/** Die letzten drei beendeten Runden mit Gewinnern und deren Stimmen. */
export async function igUmfragen(ursprung: string): Promise<IgUmfrage[]> {
  const runden = await beendeteRundenMitGewinnern(3);
  if (runden.length === 0) return [];
  const prisma = await getPrisma();
  const zaehler = await prisma.stimme.groupBy({
    by: ["optionId"],
    where: { umfrageId: { in: runden.map((r) => r.id) } },
    _count: { _all: true },
  });
  const proOption = new Map(zaehler.map((z) => [z.optionId, z._count._all]));
  return runden.map((r) => ({
    id: r.id,
    titel: r.titel,
    beendetAm: r.endetAm ? r.endetAm.toISOString() : null,
    gewinner: r.plaetze.map((p) => ({ bluete: p.handelsname, stimmen: proOption.get(p.optionId) ?? 0 })),
    url: `${ursprung}/sotm`,
  }));
}
