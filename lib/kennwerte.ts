import { sortenKennwerte, type SortenKennwerte } from "@/lib/bewertung-v2";
import { getPrisma } from "@/lib/prisma";
import { qualitaetsKennwerte, type QualitaetsKennwerte } from "@/lib/qualitaet";
import { parseBeschaffenheit, parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

export type KennwertZeile = {
  gesamtnote: number | null;
  terpenIntensitaet: string | null;
  geschmacksMatrix: string;
  beschaffenheit: string | null;
  feuchtigkeitProzent: number | null;
};

const ZEILE = { gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true, beschaffenheit: true, feuchtigkeitProzent: true } as const;

/** Aroma-Mediane und Chargenqualität aus denselben freigegebenen Bewertungen. */
export function kennwerteDaten(zeilen: readonly KennwertZeile[]): { aroma: SortenKennwerte; qualitaet: QualitaetsKennwerte } {
  return {
    aroma: sortenKennwerte(
      zeilen.map((r) => ({ gesamtnote: r.gesamtnote, terpene: parseTerpenIntensitaet(r.terpenIntensitaet), geschmack: parseGeschmacksMatrix(r.geschmacksMatrix) })),
    ),
    qualitaet: qualitaetsKennwerte(zeilen.map((r) => ({ beschaffenheit: parseBeschaffenheit(r.beschaffenheit), feuchtigkeitProzent: r.feuchtigkeitProzent }))),
  };
}

const aromaSpalten = (a: SortenKennwerte) => ({
  terpenMedian: JSON.stringify(a.terpenMedian),
  geschmackMedian: JSON.stringify(a.geschmackMedian),
  gesamtnoteMedian: a.gesamtnoteMedian,
  gesamtnoteMittel: a.gesamtnoteMittel,
  anzahl: a.anzahl,
});

/**
 * Kennwerte neu rechnen (Spec 2026-10-13): je Handelsname Aroma und Qualität, je Kultivar das Aroma
 * über alle Handelsnamen, je Vertreiber die Qualität über alle seine Handelsnamen. Beim Speichern und
 * Freigeben gerufen, nie je Seitenaufruf (CPU-Limit).
 */
export async function kennwerteFortschreiben(strainId: string): Promise<void> {
  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({ where: { id: strainId }, select: { kultivarId: true, vertreiberId: true } });
  if (!strain) return;
  const [eigene, imKultivar, beimVertreiber] = await Promise.all([
    prisma.review.findMany({ where: { strainId, freigegeben: true }, select: ZEILE }),
    strain.kultivarId ? prisma.review.findMany({ where: { freigegeben: true, strain: { kultivarId: strain.kultivarId } }, select: ZEILE }) : Promise.resolve([]),
    strain.vertreiberId ? prisma.review.findMany({ where: { freigegeben: true, strain: { vertreiberId: strain.vertreiberId } }, select: ZEILE }) : Promise.resolve([]),
  ]);

  const sorte = kennwerteDaten(eigene);
  const sorteDaten = {
    ...aromaSpalten(sorte.aroma),
    qualitaetMittel: sorte.qualitaet.qualitaetMittel,
    restfeuchteMedian: sorte.qualitaet.restfeuchteMedian,
    qualitaetAnzahl: sorte.qualitaet.anzahl,
  };
  await prisma.sortenKennwerte.upsert({ where: { strainId }, create: { strainId, ...sorteDaten }, update: sorteDaten });

  if (strain.kultivarId) {
    const kultivarDaten = aromaSpalten(kennwerteDaten(imKultivar).aroma);
    await prisma.kultivarKennwerte.upsert({
      where: { kultivarId: strain.kultivarId },
      create: { kultivarId: strain.kultivarId, ...kultivarDaten },
      update: kultivarDaten,
    });
  }
  if (strain.vertreiberId) {
    const q = kennwerteDaten(beimVertreiber).qualitaet;
    const vertreiberDaten = { qualitaetMittel: q.qualitaetMittel, achsenMittel: JSON.stringify(q.achsenMittel), restfeuchteMedian: q.restfeuchteMedian, anzahl: q.anzahl };
    await prisma.vertreiberKennwerte.upsert({
      where: { vertreiberId: strain.vertreiberId },
      create: { vertreiberId: strain.vertreiberId, ...vertreiberDaten },
      update: vertreiberDaten,
    });
  }
}
