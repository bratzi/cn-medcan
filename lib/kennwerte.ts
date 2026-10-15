import { sortenKennwerte, type SortenKennwerte } from "@/lib/bewertung-v2";
import { getPrisma } from "@/lib/prisma";
import { qualitaetsKennwerte, type QualitaetsKennwerte } from "@/lib/qualitaet";
import { parseBeschaffenheit, parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

export type AromaZeile = {
  gesamtnote: number | null;
  terpenIntensitaet: string | null;
  geschmacksMatrix: string;
};

export type ChargenZeile = {
  beschaffenheit: string | null;
  feuchtigkeitProzent: number | null;
};

export type KennwertZeile = AromaZeile & ChargenZeile;

const AROMA_ZEILE = { gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true } as const;
const CHARGEN_ZEILE = { beschaffenheit: true, feuchtigkeitProzent: true } as const;
const ZEILE = { ...AROMA_ZEILE, ...CHARGEN_ZEILE } as const;

/** Aroma-Mediane und Gesamtnote aus freigegebenen Bewertungen. */
export function aromaKennwerte(zeilen: readonly AromaZeile[]): SortenKennwerte {
  return sortenKennwerte(
    zeilen.map((r) => ({ gesamtnote: r.gesamtnote, terpene: parseTerpenIntensitaet(r.terpenIntensitaet), geschmack: parseGeschmacksMatrix(r.geschmacksMatrix) })),
  );
}

/** Chargenqualität und Restfeuchte aus freigegebenen Bewertungen. */
export function chargenKennwerte(zeilen: readonly ChargenZeile[]): QualitaetsKennwerte {
  return qualitaetsKennwerte(zeilen.map((r) => ({ beschaffenheit: parseBeschaffenheit(r.beschaffenheit), feuchtigkeitProzent: r.feuchtigkeitProzent })));
}

/** Aroma-Mediane und Chargenqualität aus denselben freigegebenen Bewertungen. */
export function kennwerteDaten(zeilen: readonly KennwertZeile[]): { aroma: SortenKennwerte; qualitaet: QualitaetsKennwerte } {
  return { aroma: aromaKennwerte(zeilen), qualitaet: chargenKennwerte(zeilen) };
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
    strain.kultivarId ? prisma.review.findMany({ where: { freigegeben: true, kultivarId: strain.kultivarId }, select: AROMA_ZEILE }) : Promise.resolve([]),
    strain.vertreiberId ? prisma.review.findMany({ where: { freigegeben: true, strain: { vertreiberId: strain.vertreiberId } }, select: CHARGEN_ZEILE }) : Promise.resolve([]),
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
    const kultivarDaten = aromaSpalten(aromaKennwerte(imKultivar));
    await prisma.kultivarKennwerte.upsert({
      where: { kultivarId: strain.kultivarId },
      create: { kultivarId: strain.kultivarId, ...kultivarDaten },
      update: kultivarDaten,
    });
  }
  if (strain.kultivarId && strain.vertreiberId) {
    const paar = await prisma.review.findMany({
      where: { freigegeben: true, kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId },
      select: { gesamtnote: true },
    });
    const noten = paar.map((r) => r.gesamtnote).filter((n): n is number => n !== null);
    const daten = { anzahl: paar.length, gesamtnoteMittel: noten.length ? Math.round((noten.reduce((s, n) => s + n, 0) / noten.length) * 10) / 10 : null };
    await prisma.kultivarVertreiberKennwerte.upsert({
      where: { kultivarId_vertreiberId: { kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId } },
      create: { kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId, ...daten },
      update: daten,
    });
  }
  if (strain.vertreiberId) {
    const q = chargenKennwerte(beimVertreiber);
    const vertreiberDaten = { qualitaetMittel: q.qualitaetMittel, achsenMittel: JSON.stringify(q.achsenMittel), restfeuchteMedian: q.restfeuchteMedian, anzahl: q.anzahl };
    await prisma.vertreiberKennwerte.upsert({
      where: { vertreiberId: strain.vertreiberId },
      create: { vertreiberId: strain.vertreiberId, ...vertreiberDaten },
      update: vertreiberDaten,
    });
  }
}
