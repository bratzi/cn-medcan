import {
  AEHNLICH_SQL,
  aehnlichVeraltet,
  empfehlungenBerechnen,
  empfehlungenErsetzen,
  KANDIDATEN_ANZAHL,
  KANDIDATEN_SQL,
  profilTerpene,
  SORTEN_AROMA_SQL,
  sortenAusZeilen,
  TERPENE_SQL,
  type SortenAromaZeile,
  type TerpenZeile,
} from "@/lib/empfehlung";
import { getEnv } from "@/lib/cloudflare";
import { getPrisma } from "@/lib/prisma";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/** Obergrenze eigener Bewertungen im Profil; erreicht wird geloggt. */
const BEWERTUNGEN_HOECHSTENS = 1000;

/**
 * Empfehlungen eines Mitglieds neu berechnen und in `nutzer_empfehlungen`
 * schreiben (T11, Nutzer 2026-09-29). Läuft beim Speichern einer Bewertung,
 * nie je Seitenaufruf. Zählen alle eigenen Bewertungen, auch noch nicht
 * freigegebene: es geht um den Geschmack des Mitglieds, nicht um die Community.
 * Aroma aller Sorten kommt als eine Zeile je Sorte (Review T11: CPU 10 ms).
 */
export async function empfehlungenFortschreiben(mitgliedId: string): Promise<void> {
  const prisma = await getPrisma();
  const [eigene, terpene] = await Promise.all([
    prisma.review.findMany({
      where: { autorId: mitgliedId },
      orderBy: { erstelltAm: "desc" },
      select: { strainId: true, gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true },
      take: BEWERTUNGEN_HOECHSTENS,
    }),
    prisma.$queryRawUnsafe<TerpenZeile[]>(TERPENE_SQL),
  ]);
  if (eigene.length >= BEWERTUNGEN_HOECHSTENS) console.warn("empfehlungen: Bewertungsgrenze erreicht", BEWERTUNGEN_HOECHSTENS);
  const bewertungen = eigene.map((r) => ({
    strainId: r.strainId,
    gesamtnote: r.gesamtnote,
    terpene: parseTerpenIntensitaet(r.terpenIntensitaet),
    geschmack: parseGeschmacksMatrix(r.geschmacksMatrix),
  }));
  const bewerteteIds = JSON.stringify([...new Set(bewertungen.map((b) => b.strainId))]);

  // Erst das Profil aus den bewerteten Sorten, dann nur die Kandidaten, die D1
  // danach vorsortiert: der Worker rechnet über rund 150 statt 700 Sorten.
  const bewertete = sortenAusZeilen(terpene, await prisma.$queryRawUnsafe<SortenAromaZeile[]>(SORTEN_AROMA_SQL, bewerteteIds));
  const gewichte = profilTerpene(bewertungen, bewertete, terpene);
  const kandidaten =
    Object.keys(gewichte).length === 0
      ? []
      : sortenAusZeilen(
          terpene,
          await prisma.$queryRawUnsafe<SortenAromaZeile[]>(
            KANDIDATEN_SQL,
            JSON.stringify(gewichte),
            bewerteteIds,
            KANDIDATEN_ANZAHL,
          ),
        );
  const liste = empfehlungenBerechnen(bewertungen, [...bewertete, ...kandidaten]);

  // Atomar ersetzen: D1-batch läuft als eine Transaktion, Prismas $transaction
  // auf D1 dagegen als Einzelabfragen (siehe lib/auth.ts).
  const { DB } = await getEnv();
  await DB.batch(empfehlungenErsetzen(mitgliedId, liste).map((a) => DB.prepare(a.sql).bind(...a.params)));
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

function aehnlicheAus(roh: string): AehnlicheSorte[] {
  try {
    const obj: unknown = JSON.parse(roh);
    if (!Array.isArray(obj)) return [];
    return obj.filter(
      (x): x is AehnlicheSorte =>
        !!x && typeof x.slug === "string" && typeof x.handelsname === "string" && Array.isArray(x.gemeinsam),
    );
  } catch {
    return [];
  }
}

/**
 * „Ähnlich im Aroma“ auf der Blütenseite, auch für Gäste: liest eine Zeile aus
 * `sorten_aehnlich`. Fehlt sie oder ist sie älter als eine Woche, rechnet D1
 * einmal neu (`AEHNLICH_SQL`) und speichert das Ergebnis (Review T11).
 */
export async function aehnlichImAroma(strainId: string): Promise<AehnlicheSorte[]> {
  const prisma = await getPrisma();
  const gespeichert = await prisma.sortenAehnlich.findUnique({ where: { strainId } });
  const jetzt = Date.now();
  if (gespeichert && !aehnlichVeraltet(gespeichert.berechnetAm.getTime(), jetzt)) return aehnlicheAus(gespeichert.liste);

  const zeilen = await prisma.$queryRawUnsafe<{ slug: string; handelsname: string; gemeinsam: string | null }[]>(
    AEHNLICH_SQL,
    strainId,
    strainId,
  );
  const liste: AehnlicheSorte[] = zeilen.map((z) => ({
    slug: z.slug,
    handelsname: z.handelsname,
    gemeinsam: (z.gemeinsam ?? "").split("|").filter(Boolean),
  }));
  const daten = { liste: JSON.stringify(liste), berechnetAm: new Date(jetzt) };
  // Scheitert das Speichern (etwa zwei Aufrufe zugleich), gilt die Liste trotzdem.
  await prisma.sortenAehnlich
    .upsert({ where: { strainId }, create: { strainId, ...daten }, update: daten })
    .catch((fehler: unknown) => console.error("sorten_aehnlich speichern fehlgeschlagen", fehler));
  return liste;
}
