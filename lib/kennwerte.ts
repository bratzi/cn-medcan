import { sortenKennwerte } from "@/lib/bewertung-v2";
import { getPrisma } from "@/lib/prisma";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/** Community-Mediane der Sorte aus allen freigegebenen Bewertungen neu berechnen. */
export async function kennwerteFortschreiben(strainId: string): Promise<void> {
  const prisma = await getPrisma();
  const alle = await prisma.review.findMany({
    where: { strainId, freigegeben: true },
    select: { gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true },
  });
  const k = sortenKennwerte(
    alle.map((r) => ({
      gesamtnote: r.gesamtnote,
      terpene: parseTerpenIntensitaet(r.terpenIntensitaet),
      geschmack: parseGeschmacksMatrix(r.geschmacksMatrix),
    })),
  );
  const daten = {
    terpenMedian: JSON.stringify(k.terpenMedian),
    geschmackMedian: JSON.stringify(k.geschmackMedian),
    gesamtnoteMedian: k.gesamtnoteMedian,
    gesamtnoteMittel: k.gesamtnoteMittel,
    anzahl: k.anzahl,
  };
  await prisma.sortenKennwerte.upsert({ where: { strainId }, create: { strainId, ...daten }, update: daten });
}
