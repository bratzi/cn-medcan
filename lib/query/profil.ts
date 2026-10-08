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
import {
  FREMDE_NOTEN_SQL,
  noteOderErsatz,
  oeffentlicheDaten,
  profilAnzeige,
  profilAusDaten,
  profilDaten,
  profilErsetzen,
  profilNeuRechnen,
} from "@/lib/profil";
import type { AuswertungsZeile, ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";
import { profilVerlauf, verlaufAusDaten, verlaufDaten } from "@/lib/profil-verlauf";
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
 * Mittel ihrer fünf Noten. Das öffentliche Netz (Spalte `oeffentlich`) zählt
 * nur freigegebene; deshalb läuft das auch nach Freigabe und Verwerfen in /admin.
 */
export async function profilFortschreiben(mitgliedId: string): Promise<void> {
  const prisma = await getPrisma();
  const [eigene, terpene] = await Promise.all([
    prisma.review.findMany({
      where: { autorId: mitgliedId },
      orderBy: { erstelltAm: "desc" },
      select: {
        erstelltAm: true,
        strainId: true,
        freigegeben: true,
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
  // Verlauf (Stufe 3): dieselben Bewertungen mit Datum, aus heutiger Sicht nachgerechnet.
  const mitDatum = bewertungen.map((b, i) => ({ ...b, erstelltAm: eigene[i].erstelltAm }));
  // Öffentlich nur, was freigegeben ist (Review W1): eigenes Netz für /profil/<kurzId>.
  const freigegeben = bewertungen.filter((_, i) => eigene[i].freigegeben);
  const daten = {
    ...profilDaten(profilAnzeige(bewertungen, bewertete)),
    oeffentlich: oeffentlicheDaten(profilAnzeige(freigegeben, bewertete)),
    verlauf: verlaufDaten(profilVerlauf(mitDatum, bewertete)),
    berechnetAm: new Date(),
  };

  // Atomar ersetzen: D1-batch läuft als eine Transaktion, Prismas $transaction
  // auf D1 dagegen als Einzelabfragen (siehe lib/auth.ts). Vorschläge und
  // Profil gehen in dieselbe Batch (Review Profil K1).
  const { DB } = await getEnv();
  const anweisungen = [...empfehlungenErsetzen(mitgliedId, liste), profilErsetzen(mitgliedId, daten)];
  await DB.batch(anweisungen.map((a) => DB.prepare(a.sql).bind(...a.params)));
}

/** Der gespeicherte Stand, eine Abfrage; null, wenn noch nie gerechnet. */
export async function ladeProfil(
  mitgliedId: string,
): Promise<{ werte: ProfilWerte; berechnetAm: Date; verlauf: VerlaufSchritt[] } | null> {
  const prisma = await getPrisma();
  const z = await prisma.nutzerProfil.findUnique({ where: { mitgliedId } });
  return z ? { werte: profilAusDaten(z), berechnetAm: z.berechnetAm, verlauf: verlaufAusDaten(z.verlauf) } : null;
}

/**
 * Stand für /profil (Spec Profil 4.4): der gespeicherte, außer er fehlt oder ist
 * älter als 24 h oder sein Verlauf fehlt (Altprofil). Dann einmal neu rechnen, damit neue Community-Werte ankommen.
 * Scheitert das, gilt der alte Stand (oder keiner); der Fehler wird geloggt.
 */
export async function aktuellesProfil(
  mitgliedId: string,
): Promise<{ werte: ProfilWerte; berechnetAm: Date; verlauf: VerlaufSchritt[] } | null> {
  const gespeichert = await ladeProfil(mitgliedId);
  if (!profilNeuRechnen(gespeichert, Date.now())) return gespeichert;
  try {
    await profilFortschreiben(mitgliedId);
    return await ladeProfil(mitgliedId);
  } catch (fehler) {
    console.error("profilFortschreiben fehlgeschlagen", fehler);
    return gespeichert;
  }
}

/**
 * Eigene Bewertungen mit Sorte und dem Mittel der fremden Noten (Spec 4.5).
 * Das fremde Mittel kommt direkt aus `reviews`, nicht aus `sorten_kennwerte`:
 * dort steckt die eigene Note mit drin, und `anzahl` zählt auch Bewertungen
 * ohne Gesamtnote; herausrechnen ginge schief (Review Profil W1).
 */
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
      strainId: true,
      strain: { select: { slug: true, handelsname: true } },
    },
  });
  const fremde = new Map<string, { mittel: number | null; anzahl: number }>();
  if (zeilen.length > 0) {
    const roh = await prisma.$queryRawUnsafe<{ sid: string; m: unknown; n: unknown }[]>(
      FREMDE_NOTEN_SQL,
      mitgliedId,
      JSON.stringify(zeilen.map((z) => z.strainId)),
    );
    for (const r of roh) {
      const m = Number(r.m);
      fremde.set(r.sid, { mittel: Number.isFinite(m) ? m : null, anzahl: Number(r.n) || 0 });
    }
  }
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
    community: fremde.get(z.strainId) ?? null,
  }));
}
