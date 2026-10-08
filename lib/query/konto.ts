import { istUmfragePhase } from "@/db/enums";
import type { StimmZeile } from "@/lib/konto";
import { getPrisma } from "@/lib/prisma";

/** So viele Runden zeigt „Deine Stimmen“ (Spec 7). */
export const MEINE_STIMMEN = 10;

/** Deine letzten Stimmen mit Sorte, Runde und Ausgang, eine Abfrage (Spec 7). */
export async function ladeStimmen(mitgliedId: string): Promise<StimmZeile[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.stimme.findMany({
    where: { mitgliedId },
    orderBy: { abgegebenAm: "desc" },
    take: MEINE_STIMMEN,
    select: {
      umfrageId: true,
      abgegebenAm: true,
      umfrage: { select: { titel: true, phase: true } },
      option: {
        select: {
          istGewinner: true,
          ergebnisReviewId: true,
          strain: { select: { slug: true, handelsname: true, herstellerBildPfad: true } },
        },
      },
    },
  });
  return zeilen.map((z) => ({
    umfrageId: z.umfrageId,
    rundentitel: z.umfrage.titel,
    // Werte an den Triggern vorbei fallen auf „beendet“ statt ungeprüft durchzugehen.
    phase: istUmfragePhase(z.umfrage.phase) ? z.umfrage.phase : "BEENDET",
    abgegebenAm: z.abgegebenAm,
    slug: z.option.strain.slug,
    handelsname: z.option.strain.handelsname,
    bildPfad: z.option.strain.herstellerBildPfad,
    istGewinner: z.option.istGewinner,
    ergebnisReviewId: z.option.ergebnisReviewId,
  }));
}

/** Alle deine Stimmen und wie viele davon gewonnen haben, eine Abfrage. */
export async function stimmZahlen(mitgliedId: string): Promise<{ stimmen: number; gewonnen: number }> {
  const prisma = await getPrisma();
  const [z] = await prisma.$queryRawUnsafe<{ n: unknown; g: unknown }[]>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(o.ist_gewinner), 0) AS g
     FROM stimmen s JOIN umfrage_optionen o ON o.id = s.option_id
     WHERE s.mitglied_id = ?`,
    mitgliedId,
  );
  return { stimmen: Number(z?.n) || 0, gewonnen: Number(z?.g) || 0 };
}
