import { herstellerRangliste } from "@/lib/lieblingshersteller";
import { getPrisma } from "@/lib/prisma";
import { noteOderErsatz } from "@/lib/profil";
import type { HerstellerRang } from "@/lib/profil-typen";

/** Eigene Bewertungen mit Hersteller der Sorte, je Aufruf gerechnet (reine Arithmetik, höchstens 1000 Zeilen). */
export async function ladeLieblingshersteller(mitgliedId: string): Promise<HerstellerRang[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: 1000,
    select: {
      gesamtnote: true,
      aussehen: true,
      geruch: true,
      geschmack: true,
      wirkung: true,
      konsistenz: true,
      strain: { select: { hersteller: { select: { id: true, name: true } } } },
    },
  });
  return herstellerRangliste(
    zeilen.map((z) => ({ herstellerId: z.strain.hersteller?.id ?? null, hersteller: z.strain.hersteller?.name ?? null, note: noteOderErsatz(z) })),
  );
}
