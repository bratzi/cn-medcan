import "server-only";

import { getPrisma } from "@/lib/prisma";
import { istVorschlagStatus, type VorschlagStatus } from "@/db/enums";
import { terpeneLesen, type OffenerVorschlag } from "@/lib/vorschlag-eingabe";

/** Obergrenzen: jede Liste hat ein take. */
const MAX_ADMIN = 200;
const MAX_EIGENE = 50;

/** Namen der Katalog-Terpene, alphabetisch. Die einzige erlaubte Auswahl im Formular. */
export async function terpenNamen(): Promise<string[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.terpen.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 200 });
  return zeilen.map((z) => z.name);
}

/** Steht die Bluete schon im Katalog (gleicher Slug oder Handelsname)? */
export async function blueteVorhanden(slug: string, handelsname: string) {
  const prisma = await getPrisma();
  return prisma.strain.findFirst({
    where: { OR: [{ slug }, { handelsname }] },
    select: { id: true, slug: true, handelsname: true },
  });
}

export async function offeneVorschlaegeFuerAdmin(): Promise<OffenerVorschlag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.sortenVorschlag.findMany({
    where: { status: "OFFEN" },
    orderBy: { erstelltAm: "asc" },
    take: MAX_ADMIN,
    include: { mitglied: { select: { anzeigename: true } } },
  });
  return zeilen.map((z) => ({
    id: z.id,
    mitgliedId: z.mitgliedId,
    anzeigename: z.mitglied.anzeigename,
    handelsname: z.handelsname,
    schluessel: z.schluessel,
    hersteller: z.hersteller,
    kultivarName: z.kultivarName,
    kultivarTyp: z.kultivarTyp,
    thcProzent: z.thcProzent,
    cbdProzent: z.cbdProzent,
    terpene: terpeneLesen(z.terpene),
    quelle: z.quelle,
    notiz: z.notiz,
    erstelltAm: z.erstelltAm,
  }));
}

export type EigenerVorschlag = {
  id: string;
  handelsname: string;
  status: VorschlagStatus;
  begruendung: string | null;
  strainSlug: string | null;
  erstelltAm: Date;
};

/** Nur die eigenen: mitgliedId kommt aus der Sitzung, nie aus dem Formular. */
export async function eigeneVorschlaege(mitgliedId: string): Promise<EigenerVorschlag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.sortenVorschlag.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: MAX_EIGENE,
    select: {
      id: true,
      handelsname: true,
      status: true,
      begruendung: true,
      erstelltAm: true,
      strain: { select: { slug: true } },
    },
  });
  return zeilen.map((z) => ({
    id: z.id,
    handelsname: z.handelsname,
    status: istVorschlagStatus(z.status) ? z.status : "OFFEN",
    begruendung: z.begruendung,
    strainSlug: z.strain?.slug ?? null,
    erstelltAm: z.erstelltAm,
  }));
}
