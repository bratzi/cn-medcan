import "server-only";

import { MAX_BENACHRICHTIGUNGEN } from "@/lib/benachrichtigung";
import { getPrisma } from "@/lib/prisma";

export async function ungeleseneAnzahl(mitgliedId: string): Promise<number> {
  const prisma = await getPrisma();
  return prisma.benachrichtigung.count({ where: { mitgliedId, gelesenAm: null } });
}

export type Eintrag = {
  id: string;
  art: string;
  text: string;
  parameter: string | null;
  link: string | null;
  gelesen: boolean;
  erstelltAm: Date;
};

/** Neueste zuerst; nur die eigenen (mitgliedId aus der Sitzung). */
export async function benachrichtigungenLaden(mitgliedId: string): Promise<Eintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.benachrichtigung.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: MAX_BENACHRICHTIGUNGEN,
    select: { id: true, art: true, text: true, parameter: true, link: true, gelesenAm: true, erstelltAm: true },
  });
  return zeilen.map((z) => ({
    id: z.id,
    art: z.art,
    text: z.text,
    parameter: z.parameter,
    link: z.link,
    gelesen: z.gelesenAm !== null,
    erstelltAm: z.erstelltAm,
  }));
}
