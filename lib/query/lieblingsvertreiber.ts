import { vertreiberRangliste } from "@/lib/lieblingsvertreiber";
import { getPrisma } from "@/lib/prisma";
import { qualitaetAusBeschaffenheit } from "@/lib/qualitaet";
import { parseBeschaffenheit } from "@/lib/query/bewertung";
import type { VertreiberRang } from "@/lib/profil-typen";

/** Eigene Bewertungen mit Vertreiber der Sorte, je Aufruf gerechnet (reine Arithmetik, höchstens 1000 Zeilen). */
export async function ladeLieblingsvertreiber(mitgliedId: string): Promise<VertreiberRang[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: 1000,
    select: {
      beschaffenheit: true,
      strain: { select: { vertreiber: { select: { id: true, name: true } } } },
    },
  });
  return vertreiberRangliste(
    zeilen.map((z) => ({
      vertreiberId: z.strain.vertreiber?.id ?? null,
      vertreiber: z.strain.vertreiber?.name ?? null,
      qualitaet: qualitaetAusBeschaffenheit(parseBeschaffenheit(z.beschaffenheit)),
    })),
  );
}
