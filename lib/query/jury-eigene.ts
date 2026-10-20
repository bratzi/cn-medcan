import "server-only";

import { getPrisma } from "@/lib/prisma";

const MAX_EIGENE = 50;

/** Eigene Jury-Beiträge für das Profil (alle Stände, zuletzt geänderte zuerst). */
export async function eigeneJuryBeitraege(mitgliedId: string) {
  const prisma = await getPrisma();
  return prisma.juryBeitrag.findMany({
    where: { autorId: mitgliedId },
    orderBy: { geaendertAm: "desc" },
    take: MAX_EIGENE,
    select: { id: true, slug: true, titel: true, anriss: true, text: true, status: true, notiz: true, reviewId: true,
      bilder: { orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, breite: true, hoehe: true, symbolbild: true, alt: true } },
    },
  });
}

/** Eigene freigegebene Bewertungen zur Auswahl im Editor: Variante und Vertreiber für das Label. */
export async function eigeneFreigegebeneBewertungen(mitgliedId: string) {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId, freigegeben: true },
    orderBy: { erstelltAm: "desc" },
    take: 100,
    select: {
      id: true,
      strain: { select: { handelsname: true } },
      kultivar: { select: { name: true } },
      vertreiber: { select: { name: true } },
    },
  });
  return zeilen.map((z) => ({ id: z.id, sorte: z.kultivar?.name ?? z.strain.handelsname, vertreiber: z.vertreiber?.name ?? null }));
}
