import { musterBildId } from "@/lib/budpics";
import { blueteBild } from "@/lib/medien";
import { getPrisma } from "@/lib/prisma";
import { ordne, seiteVon, type Rangliste, type SortenZeile } from "@/lib/rangliste";

export type RanglistenKarte = {
  rang: number;
  slug: string;
  handelsname: string;
  hersteller: string | null;
  bildId: string;
  schnitt: number;
  anzahl: number;
  betreiber: number | null;
  zuletzt: string;
  abstand: number | null;
};
export type RanglistenAntwort = { nach: Rangliste; seite: number; seiten: number; karten: RanglistenKarte[] };

type RohZeile = {
  strainId: unknown;
  anzahl: unknown;
  summe: unknown;
  betreiber: unknown;
  communityAnzahl: unknown;
  communitySumme: unknown;
  zuletzt: unknown;
};

/**
 * Eine Zeile je Sorte, gerechnet in D1 (Spec Bewertungsbuch 5): nur freigegebene
 * Bewertungen mit Gesamtnote und aktive Sorten. `erstellt_am` steht je nach
 * Schreiber als ISO-Text (Prisma) oder als `YYYY-MM-DD HH:MM:SS` (Seed, SQL-
 * Vorgabe); strftime vereinheitlicht beides, damit MAX() am selben Tag stimmt.
 */
const SORTEN_SQL = `SELECT r.strain_id AS strainId,
       COUNT(*) AS anzahl,
       SUM(r.gesamtnote) AS summe,
       (SELECT b.gesamtnote FROM reviews b
         WHERE b.strain_id = r.strain_id AND b.freigegeben = 1 AND b.ist_redaktionell = 1 AND b.gesamtnote IS NOT NULL
         ORDER BY b.erstellt_am DESC LIMIT 1) AS betreiber,
       SUM(CASE WHEN r.ist_redaktionell = 0 THEN 1 ELSE 0 END) AS communityAnzahl,
       SUM(CASE WHEN r.ist_redaktionell = 0 THEN r.gesamtnote ELSE 0 END) AS communitySumme,
       MAX(strftime('%Y-%m-%dT%H:%M:%fZ', r.erstellt_am)) AS zuletzt
FROM reviews r
JOIN strains s ON s.id = r.strain_id AND s.aktiv = 1
WHERE r.freigegeben = 1 AND r.gesamtnote IS NOT NULL
GROUP BY r.strain_id`;

function alsZeile(z: RohZeile): SortenZeile {
  return {
    strainId: String(z.strainId),
    anzahl: Number(z.anzahl) || 0,
    summe: Number(z.summe) || 0,
    betreiber: z.betreiber === null || z.betreiber === undefined ? null : Number(z.betreiber),
    communityAnzahl: Number(z.communityAnzahl) || 0,
    communitySumme: Number(z.communitySumme) || 0,
    zuletzt: String(z.zuletzt ?? ""),
  };
}

export async function ladeRangliste(nach: Rangliste, seite: number): Promise<RanglistenAntwort> {
  const prisma = await getPrisma();
  const roh = await prisma.$queryRawUnsafe<RohZeile[]>(SORTEN_SQL);
  const { plaetze, seiten } = seiteVon(ordne(roh.map(alsZeile), nach), seite);
  const ids = plaetze.map((p) => p.strainId);
  const sorten = ids.length
    ? await prisma.strain.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true, handelsname: true, herstellerBildPfad: true, hersteller: { select: { name: true } } },
      })
    : [];
  const nachId = new Map(sorten.map((s) => [s.id, s]));
  const karten = plaetze.flatMap((p): RanglistenKarte[] => {
    const s = nachId.get(p.strainId);
    if (!s) return [];
    return [
      {
        rang: p.rang,
        slug: s.slug,
        handelsname: s.handelsname,
        hersteller: s.hersteller?.name ?? null,
        bildId: blueteBild(s.herstellerBildPfad) ?? musterBildId(s.slug),
        schnitt: p.schnitt,
        anzahl: p.anzahl,
        betreiber: p.betreiber,
        zuletzt: p.zuletzt,
        abstand: p.abstand,
      },
    ];
  });
  return { nach, seite, seiten, karten };
}
