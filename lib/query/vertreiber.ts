import { getPrisma } from "@/lib/prisma";

export type VertreiberEintrag = {
  slug: string;
  handelsname: string;
  vertreiberName: string | null;
  qualitaet: number | null;
  restfeuchte: number | null;
  anzahl: number;
  aktuell: boolean;
};

/** Alle aktiven Handelsnamen derselben Blüte (Kultivar) mit Chargenqualität (Spec 2026-10-13). */
export async function ladeVertreiberDerBluete(kultivarId: string, aktuelleId: string): Promise<VertreiberEintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.strain.findMany({
    where: { kultivarId, aktiv: true },
    select: {
      id: true,
      slug: true,
      handelsname: true,
      vertreiber: { select: { name: true } },
      kennwerte: { select: { qualitaetMittel: true, restfeuchteMedian: true, qualitaetAnzahl: true } },
    },
    take: 30,
  });
  return zeilen
    .map((z) => ({
      slug: z.slug,
      handelsname: z.handelsname,
      vertreiberName: z.vertreiber?.name ?? null,
      qualitaet: z.kennwerte?.qualitaetMittel ?? null,
      restfeuchte: z.kennwerte?.restfeuchteMedian ?? null,
      anzahl: z.kennwerte?.qualitaetAnzahl ?? 0,
      aktuell: z.id === aktuelleId,
    }))
    .sort((a, b) => b.anzahl - a.anzahl || a.handelsname.localeCompare(b.handelsname, "de"));
}
