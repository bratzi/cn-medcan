import { BUDPIC_MAX_ANZEIGE, budpicAusBewertung } from "@/lib/budpics";
import { BUDPICS_JE_KULTIVAR_SQL } from "@/lib/query/budpics-sql";
import { alsIso } from "@/lib/katalog/verdichten";
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

/**
 * Freigegebene Budpics je Blüte (Kultivar) für die Blüten-Ansicht des Katalogs:
 * dieselben Bilder wie auf den Karten der Handelsnamen, gesammelt über alle
 * Handelsnamen der Blüte. Ein `in` mit höchstens einer Katalogseite Ids.
 */
export async function ladeFreieBudpicsJeKultivar(kultivarIds: readonly string[]): Promise<Map<string, BudpicAnzeige[]>> {
  const ergebnis = new Map<string, BudpicAnzeige[]>();
  if (kultivarIds.length === 0) return ergebnis;
  const prisma = await getPrisma();
  const zeilen = await prisma.$queryRawUnsafe<{ id: string; k: string; e: unknown; b: number; h: number; n: string }[]>(
    BUDPICS_JE_KULTIVAR_SQL(kultivarIds.length),
    ...kultivarIds,
  );
  for (const z of zeilen) {
    const liste = ergebnis.get(z.k) ?? [];
    liste.push({ id: z.id, nutzer: z.n, erstelltAm: new Date(alsIso(z.e) ?? 0), breite: Number(z.b), hoehe: Number(z.h) });
    ergebnis.set(z.k, liste);
  }
  return ergebnis;
}

export type OffenesBudpic = { id: string; strainSlug: string; kultivarSlug: string | null; handelsname: string; nutzer: string; erstelltAm: Date; breite: number; hoehe: number; ausBewertung: boolean };

/**
 * Budpics eines Status fuer /admin; ohne `daten`. Offene aelteste zuerst
 * (die Warteschlange), freigegebene neueste zuerst (zum Zurueckziehen).
 */
export async function ladeBudpicsNachStatus(status: "OFFEN" | "FREIGEGEBEN"): Promise<{ eintraege: OffenesBudpic[]; gesamt: number }> {
  const prisma = await getPrisma();
  const [zeilen, gesamt] = await Promise.all([
    prisma.budpic.findMany({
      where: { status },
      select: {
        id: true,
        erstelltAm: true,
        breite: true,
        hoehe: true,
        reviewId: true,
        strain: { select: { slug: true, handelsname: true, kultivar: { select: { slug: true } } } },
        mitglied: { select: { anzeigename: true } },
      },
      orderBy: { erstelltAm: status === "OFFEN" ? "asc" : "desc" },
      take: 50,
    }),
    prisma.budpic.count({ where: { status } }),
  ]);
  return {
    gesamt,
    eintraege: zeilen.map((z) => ({
      id: z.id,
      strainSlug: z.strain.slug,
      kultivarSlug: z.strain.kultivar?.slug ?? null,
      handelsname: z.strain.handelsname,
      nutzer: z.mitglied.anzeigename,
      erstelltAm: z.erstelltAm,
      breite: z.breite,
      hoehe: z.hoehe,
      ausBewertung: budpicAusBewertung(z.reviewId),
    })),
  };
}

/** Wer schaut: Gaeste sehen einen Anmelde-Link, Mitglieder ohne Freigabe einen Hinweis, freigegebene den Upload. */
export async function budpicZugang(): Promise<"gast" | "mitglied" | "freigegeben"> {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) return "gast";
  return mitglied.freigegeben ? "freigegeben" : "mitglied";
}
