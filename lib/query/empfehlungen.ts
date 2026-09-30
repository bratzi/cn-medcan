import { istGeschmacksKategorie } from "@/db/enums";
import type { Werte } from "@/lib/bewertung-v2";
import { AEHNLICH_SQL, empfehlungenBerechnen, type SortenAroma } from "@/lib/empfehlung";
import { getPrisma } from "@/lib/prisma";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/** Obergrenze der Zeilen beim Neuberechnen; heute rund 700 aktive Sorten mit je bis zu fünf Terpenen. */
const ZEILEN_HOECHSTENS = 20000;

/** Community-Median als Zahlen je Achse; kaputter Text ergibt ein leeres Objekt. */
function werteAus(roh: string | null | undefined): Werte {
  if (!roh) return {};
  try {
    const obj: unknown = JSON.parse(roh);
    if (!obj || typeof obj !== "object") return {};
    const aus: Werte = {};
    for (const [k, v] of Object.entries(obj)) if (typeof v === "number" && Number.isFinite(v)) aus[k] = v;
    return aus;
  } catch {
    return {};
  }
}

/**
 * Empfehlungen eines Mitglieds neu berechnen und in `nutzer_empfehlungen`
 * schreiben (T11, Nutzer 2026-09-29). Läuft beim Speichern einer Bewertung,
 * nie je Seitenaufruf. Zählen alle eigenen Bewertungen, auch noch nicht
 * freigegebene: es geht um den Geschmack des Mitglieds, nicht um die Community.
 */
export async function empfehlungenFortschreiben(mitgliedId: string): Promise<void> {
  const prisma = await getPrisma();
  // Terpene aller aktiven Sorten flach in einer Abfrage (T11: schlank für das
  // CPU-Limit, keine verschachtelte Relation über 700 Sorten).
  const [eigene, terpenZeilen, medianZeilen] = await Promise.all([
    prisma.review.findMany({
      where: { autorId: mitgliedId },
      select: { strainId: true, gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true },
      take: 1000,
    }),
    prisma.$queryRawUnsafe<{ sid: string; rang: number; name: string; geschmack: string }[]>(
      `SELECT st.strain_id AS sid, st.rang AS rang, t.name AS name, t.geschmack AS geschmack
       FROM strain_terpene st
       JOIN strains s ON s.id = st.strain_id AND s.aktiv = 1
       JOIN terpene t ON t.id = st.terpen_id
       LIMIT ${ZEILEN_HOECHSTENS}`,
    ),
    prisma.sortenKennwerte.findMany({
      where: { anzahl: { gt: 0 }, strain: { aktiv: true } },
      select: { strainId: true, geschmackMedian: true },
      take: ZEILEN_HOECHSTENS,
    }),
  ]);

  const jeSorte = new Map<string, SortenAroma>();
  for (const z of terpenZeilen) {
    if (!istGeschmacksKategorie(z.geschmack)) continue;
    let sorte = jeSorte.get(z.sid);
    if (!sorte) jeSorte.set(z.sid, (sorte = { strainId: z.sid, terpene: [] }));
    (sorte.terpene as { name: string; geschmack: typeof z.geschmack; rang: number }[]).push({
      name: z.name,
      geschmack: z.geschmack,
      rang: Number(z.rang),
    });
  }
  for (const k of medianZeilen) {
    const sorte = jeSorte.get(k.strainId);
    if (sorte) sorte.geschmackMedian = werteAus(k.geschmackMedian);
  }
  const aromen = [...jeSorte.values()];
  const liste = empfehlungenBerechnen(
    eigene.map((r) => ({
      strainId: r.strainId,
      gesamtnote: r.gesamtnote,
      terpene: parseTerpenIntensitaet(r.terpenIntensitaet),
      geschmack: parseGeschmacksMatrix(r.geschmacksMatrix),
    })),
    aromen,
  );

  // Ersetzen statt abgleichen: höchstens sechs Zeilen je Mitglied.
  await prisma.nutzerEmpfehlung.deleteMany({ where: { mitgliedId } });
  if (liste.length > 0) {
    await prisma.nutzerEmpfehlung.createMany({
      data: liste.map((e) => ({
        mitgliedId,
        strainId: e.strainId,
        rang: e.rang,
        score: e.score,
        bezugStrainId: e.bezugStrainId,
        gemeinsam: JSON.stringify(e.gemeinsam),
      })),
    });
  }
}

export type GespeicherteEmpfehlung = {
  slug: string;
  handelsname: string;
  bezugHandelsname: string;
  bezugSlug: string;
  /** Schlüssel wie `t:Myrcen` oder `g:ZITRUS`. */
  gemeinsam: string[];
};

function gemeinsamAus(roh: string): string[] {
  try {
    const obj: unknown = JSON.parse(roh);
    return Array.isArray(obj) ? obj.filter((x): x is string => typeof x === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}

/** Die vorberechnete Liste eines Mitglieds, eine Abfrage, höchstens sechs. */
export async function ladeEmpfehlungen(mitgliedId: string): Promise<GespeicherteEmpfehlung[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.nutzerEmpfehlung.findMany({
    where: { mitgliedId, strain: { aktiv: true } },
    orderBy: { rang: "asc" },
    take: 6,
    select: {
      gemeinsam: true,
      strain: { select: { slug: true, handelsname: true } },
      bezug: { select: { slug: true, handelsname: true } },
    },
  });
  return zeilen.map((z) => ({
    slug: z.strain.slug,
    handelsname: z.strain.handelsname,
    bezugHandelsname: z.bezug.handelsname,
    bezugSlug: z.bezug.slug,
    gemeinsam: gemeinsamAus(z.gemeinsam),
  }));
}

export type AehnlicheSorte = { slug: string; handelsname: string; gemeinsam: string[] };

/**
 * „Ähnlich im Aroma“ auf der Blütenseite, auch für Gäste: Kosinus über die
 * Herstellerterpene (Gewicht 1/Rang), gerechnet in D1 statt im Worker. So
 * kostet der Seitenaufruf keine Worker-CPU für 700 Sorten; D1 liest nur die
 * Sorten, die mindestens ein Terpen teilen (Index auf terpen_id). Sortiert
 * wird nach dem quadrierten Kosinus (gleiche Reihenfolge, ohne SQRT).
 */
export async function aehnlichImAroma(strainId: string): Promise<AehnlicheSorte[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.$queryRawUnsafe<{ slug: string; handelsname: string; gemeinsam: string | null }[]>(
    AEHNLICH_SQL,
    strainId,
    strainId,
  );
  return zeilen.map((z) => ({
    slug: z.slug,
    handelsname: z.handelsname,
    gemeinsam: (z.gemeinsam ?? "").split("|").filter(Boolean),
  }));
}
