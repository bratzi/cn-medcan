import { BUDPIC_MAX_ANZEIGE } from "@/lib/budpics";
import { getPrisma } from "@/lib/prisma";
import { aktuellesMitglied } from "@/lib/session";

export type BudpicAnzeige = { id: string; nutzer: string; erstelltAm: Date; breite: number; hoehe: number };

/** Obergrenze der Abfrage: jede Liste hat ein `take` (siehe edge-stack-master). */
const MAX_ZEILEN = 400;

/**
 * Freigegebene Budpics der genannten Sorten, je Sorte die neuesten
 * BUDPIC_MAX_ANZEIGE. Eine Abfrage, nie mit `daten` (das Bild kommt ueber
 * /api/bild/<id>). Ohne Sorten keine Abfrage; sonst ein `in` mit hoechstens
 * einer Seite Sorten (weit unter dem D1-Limit von 100 gebundenen Werten).
 */
export async function ladeFreieBudpics(strainIds: readonly string[]): Promise<Map<string, BudpicAnzeige[]>> {
  const ergebnis = new Map<string, BudpicAnzeige[]>();
  if (strainIds.length === 0) return ergebnis;
  const prisma = await getPrisma();
  const zeilen = await prisma.budpic.findMany({
    where: { strainId: { in: [...strainIds] }, status: "FREIGEGEBEN" },
    select: { id: true, strainId: true, erstelltAm: true, breite: true, hoehe: true, mitglied: { select: { anzeigename: true } } },
    orderBy: { erstelltAm: "desc" },
    take: MAX_ZEILEN,
  });
  for (const z of zeilen) {
    const liste = ergebnis.get(z.strainId) ?? [];
    if (liste.length < BUDPIC_MAX_ANZEIGE) {
      liste.push({ id: z.id, nutzer: z.mitglied.anzeigename, erstelltAm: z.erstelltAm, breite: z.breite, hoehe: z.hoehe });
      ergebnis.set(z.strainId, liste);
    }
  }
  return ergebnis;
}

export type OffenesBudpic = { id: string; strainSlug: string; handelsname: string; nutzer: string; erstelltAm: Date; breite: number; hoehe: number};

/** Offene Budpics fuer /admin, aelteste zuerst; ohne `daten`. */
export async function ladeOffeneBudpics(): Promise<{ eintraege: OffenesBudpic[]; gesamt: number }> {
  const prisma = await getPrisma();
  const [zeilen, gesamt] = await Promise.all([
    prisma.budpic.findMany({
      where: { status: "OFFEN" },
      select: {
        id: true,
        erstelltAm: true,
        breite: true,
        hoehe: true,
        strain: { select: { slug: true, handelsname: true } },
        mitglied: { select: { anzeigename: true } },
      },
      orderBy: { erstelltAm: "asc" },
      take: 50,
    }),
    prisma.budpic.count({ where: { status: "OFFEN" } }),
  ]);
  return {
    gesamt,
    eintraege: zeilen.map((z) => ({
      id: z.id,
      strainSlug: z.strain.slug,
      handelsname: z.strain.handelsname,
      nutzer: z.mitglied.anzeigename,
      erstelltAm: z.erstelltAm,
      breite: z.breite,
      hoehe: z.hoehe,
    })),
  };
}

/** Wer schaut: Gaeste sehen einen Anmelde-Link, Mitglieder ohne Freigabe einen Hinweis, freigegebene den Upload. */
export async function budpicZugang(): Promise<"gast" | "mitglied" | "freigegeben"> {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) return "gast";
  return mitglied.freigegeben ? "freigegeben" : "mitglied";
}
