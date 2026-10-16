import "server-only";

import { getPrisma } from "@/lib/prisma";

/** Obergrenze je Liste; reicht sie nicht mehr, kommt Cursor-Paginierung dazu (edge-stack-master 4). */
const MAX_BEITRAEGE = 50;
const MAX_AUSGABEN = 50;

export async function zaehleEingereichteJuryBeitraege(): Promise<number> {
  const prisma = await getPrisma();
  return prisma.juryBeitrag.count({ where: { status: "EINGEREICHT" } });
}

/** Beiträge eines Standes samt Autor, Bewertung und Bildern, ein Aufruf. */
export async function ladeJuryBeitraegeNachStatus(status: "EINGEREICHT" | "VEROEFFENTLICHT") {
  const prisma = await getPrisma();
  return prisma.juryBeitrag.findMany({
    where: { status },
    orderBy: status === "EINGEREICHT" ? { geaendertAm: "asc" } : { veroeffentlichtAm: "desc" },
    take: MAX_BEITRAEGE,
    select: {
      id: true,
      slug: true,
      titel: true,
      anriss: true,
      text: true,
      ausgabeId: true,
      position: true,
      igUrl: true,
      igStatus: true,
      autor: { select: { anzeigename: true } },
      review: { select: { strain: { select: { handelsname: true } }, kultivar: { select: { name: true } }, vertreiber: { select: { name: true } } } },
      bilder: { orderBy: [{ position: "asc" }, { id: "asc" }], take: 6, select: { id: true, breite: true, hoehe: true, symbolbild: true, alt: true } },
    },
  });
}

export async function ladeJuryAusgaben() {
  const prisma = await getPrisma();
  const zeilen = await prisma.juryAusgabe.findMany({
    orderBy: { erstelltAm: "desc" },
    take: MAX_AUSGABEN,
    select: { id: true, slug: true, titel: true, einleitung: true, erscheintAm: true, status: true, _count: { select: { beitraege: true } } },
  });
  return zeilen.map((z) => ({
    id: z.id,
    slug: z.slug,
    titel: z.titel,
    einleitung: z.einleitung,
    erscheintAm: z.erscheintAm ? z.erscheintAm.toISOString() : null,
    status: z.status,
    beitraege: z._count.beitraege,
  }));
}
