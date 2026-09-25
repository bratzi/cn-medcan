import "server-only";

import { getPrisma } from "@/lib/prisma";

const MAX_LISTE = 20;

export async function ungeleseneAnzahl(mitgliedId: string): Promise<number> {
  const prisma = await getPrisma();
  return prisma.benachrichtigung.count({ where: { mitgliedId, gelesenAm: null } });
}

export type Eintrag = { id: string; text: string; link: string | null; gelesen: boolean; erstelltAm: Date };

/** Neueste zuerst; nur die eigenen (mitgliedId aus der Sitzung). */
export async function benachrichtigungenLaden(mitgliedId: string): Promise<Eintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.benachrichtigung.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: MAX_LISTE,
    select: { id: true, text: true, link: true, gelesenAm: true, erstelltAm: true },
  });
  return zeilen.map((z) => ({
    id: z.id,
    text: z.text,
    link: z.link,
    gelesen: z.gelesenAm !== null,
    erstelltAm: z.erstelltAm,
  }));
}
