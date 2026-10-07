import { AEHNLICH_SQL, aehnlichVeraltet } from "@/lib/empfehlung";
import { getPrisma } from "@/lib/prisma";

export type GespeicherteEmpfehlung = {
  slug: string;
  handelsname: string;
  bezugHandelsname: string;
  bezugSlug: string;
  /** Schlüssel wie `t:Myrcen` oder `g:ZITRUS`. */
  gemeinsam: string[];
  /** Von der Community bestätigt (Spec Profil 4.3). */
  bestaetigt: boolean;
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
      bestaetigt: true,
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
    bestaetigt: z.bestaetigt,
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
