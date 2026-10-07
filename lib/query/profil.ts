import {
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
import { noteOderErsatz, profilAnzeige, profilAusDaten, profilDaten } from "@/lib/profil";
import type { AuswertungsZeile, ProfilWerte } from "@/lib/profil-typen";
import { getPrisma } from "@/lib/prisma";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/** Obergrenze eigener Bewertungen im Profil; erreicht wird geloggt. */
const BEWERTUNGEN_HOECHSTENS = 1000;

/**
 * Empfehlungen und Profilwerte eines Mitglieds neu rechnen und ablegen (T11,
 * Spec Profil 4.4). Läuft beim Speichern einer Bewertung und auf /profil, wenn
 * der Stand älter als 24 h ist; nie über alle Sorten je Seitenaufruf. Zählen
 * alle eigenen Bewertungen, auch noch nicht freigegebene: es geht um den
 * Geschmack des Mitglieds. Altbewertungen ohne Gesamtnote zählen mit dem
 * Mittel ihrer fünf Noten.
 */
export async function profilFortschreiben(mitgliedId: string): Promise<void> {
  const prisma = await getPrisma();
  const [eigene, terpene] = await Promise.all([
    prisma.review.findMany({
      where: { autorId: mitgliedId },
      orderBy: { erstelltAm: "desc" },
      select: {
        strainId: true,
        gesamtnote: true,
        aussehen: true,
        geruch: true,
        geschmack: true,
        wirkung: true,
        konsistenz: true,
        terpenIntensitaet: true,
        geschmacksMatrix: true,
      },
      take: BEWERTUNGEN_HOECHSTENS,
    }),
    prisma.$queryRawUnsafe<TerpenZeile[]>(TERPENE_SQL),
  ]);
  if (eigene.length >= BEWERTUNGEN_HOECHSTENS) console.warn("profil: Bewertungsgrenze erreicht", BEWERTUNGEN_HOECHSTENS);
  const bewertungen = eigene.map((r) => ({
    strainId: r.strainId,
    gesamtnote: noteOderErsatz(r),
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
          await prisma.$queryRawUnsafe<SortenAromaZeile[]>(KANDIDATEN_SQL, JSON.stringify(gewichte), bewerteteIds, KANDIDATEN_ANZAHL),
        );
  const liste = empfehlungenBerechnen(bewertungen, [...bewertete, ...kandidaten]);
  const daten = { ...profilDaten(profilAnzeige(bewertungen, bewertete)), berechnetAm: new Date() };

  // Atomar ersetzen: D1-batch läuft als eine Transaktion, Prismas $transaction
  // auf D1 dagegen als Einzelabfragen (siehe lib/auth.ts).
  const { DB } = await getEnv();
  await DB.batch(empfehlungenErsetzen(mitgliedId, liste).map((a) => DB.prepare(a.sql).bind(...a.params)));
  await prisma.nutzerProfil.upsert({ where: { mitgliedId }, create: { mitgliedId, ...daten }, update: daten });
}

/** Der gespeicherte Stand, eine Abfrage; null, wenn noch nie gerechnet. */
export async function ladeProfil(mitgliedId: string): Promise<{ werte: ProfilWerte; berechnetAm: Date } | null> {
  const prisma = await getPrisma();
  const z = await prisma.nutzerProfil.findUnique({ where: { mitgliedId } });
  return z ? { werte: profilAusDaten(z), berechnetAm: z.berechnetAm } : null;
}

/** Eigene Bewertungen mit Sorte und Community-Werten für die Auswertungen (Spec 4.5). */
export async function ladeAuswertungsZeilen(mitgliedId: string): Promise<AuswertungsZeile[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: BEWERTUNGEN_HOECHSTENS,
    select: {
      erstelltAm: true,
      gesamtnote: true,
      aussehen: true,
      geruch: true,
      geschmack: true,
      wirkung: true,
      konsistenz: true,
      freigegeben: true,
      strain: { select: { slug: true, handelsname: true, kennwerte: { select: { gesamtnoteMittel: true, anzahl: true } } } },
    },
  });
  return zeilen.map((z) => ({
    slug: z.strain.slug,
    handelsname: z.strain.handelsname,
    erstelltAm: z.erstelltAm,
    gesamtnote: z.gesamtnote,
    aussehen: z.aussehen,
    geruch: z.geruch,
    geschmack: z.geschmack,
    wirkung: z.wirkung,
    konsistenz: z.konsistenz,
    freigegeben: z.freigegeben,
    community: z.strain.kennwerte ? { mittel: z.strain.kennwerte.gesamtnoteMittel, anzahl: z.strain.kennwerte.anzahl } : null,
  }));
}
