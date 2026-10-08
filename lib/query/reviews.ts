import "server-only";

import { getPrisma } from "@/lib/prisma";

/** Lesezugriffe auf Bewertungen für /admin: Auswahlliste und Freigabeliste. */

// ---------------------------------------------------------------------------
//  Auswahlliste (nur /admin)
// ---------------------------------------------------------------------------

/** Obergrenze der Auswahlliste. Eine Sorte hat eine Handvoll Chargen. */
const MAX_AUSWAHL = 100;

export type ReviewAuswahlEintrag = {
  id: string;
  strainId: string;
  chargenNr: string | null;
  /** Ein Entwurf ist verknuepfbar - die Oberflaeche schreibt es ans Label. */
  freigegeben: boolean;
  erstelltAm: Date;
};

/**
 * Die eigenen Bewertungen zu bestimmten Sorten - fuer die Auswahl in /admin.
 *
 * `freigegeben` filtert hier bewusst **nicht**: der Betreiber verknuepft das
 * Ergebnis einer Runde oft, bevor er die Bewertung veroeffentlicht. Die
 * Auswahl nennt den Entwurf dafuer als solchen.
 *
 * Eine Query fuer alle Sorten zusammen (`in`), nicht eine pro Platz: jede
 * Query ist ein Sub-Request. Eine leere Liste fragt gar nicht erst.
 */
export async function reviewAuswahlFuerStrains(
  strainIds: readonly string[],
  limit = MAX_AUSWAHL,
): Promise<ReviewAuswahlEintrag[]> {
  const eindeutig = [...new Set(strainIds)];
  if (eindeutig.length === 0) return [];

  const prisma = await getPrisma();
  const saetze = await prisma.review.findMany({
    where: { istRedaktionell: true, strainId: { in: eindeutig } },
    orderBy: { erstelltAm: "desc" },
    take: limit,
    select: {
      id: true,
      strainId: true,
      freigegeben: true,
      erstelltAm: true,
      charge: { select: { chargenNr: true } },
    },
  });

  return saetze.map((satz) => ({
    id: satz.id,
    strainId: satz.strainId,
    chargenNr: satz.charge?.chargenNr ?? null,
    freigegeben: satz.freigegeben,
    erstelltAm: satz.erstelltAm,
  }));
}

// ---------------------------------------------------------------------------
//  Freigabeliste (nur /admin)
// ---------------------------------------------------------------------------

export type OffeneBewertung = {
  id: string;
  handelsname: string;
  slug: string;
  chargenNr: string | null;
  autor: string | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  notiz: string | null;
  erstelltAm: Date;
};

/**
 * Community-Bewertungen, die noch auf Freigabe warten - aelteste zuerst,
 * weil die am laengsten warten. Redaktionelle Entwuerfe gehoeren nicht hierher.
 */
export async function offeneBewertungen(limit = 50): Promise<OffeneBewertung[]> {
  const prisma = await getPrisma();
  const saetze = await prisma.review.findMany({
    where: { freigegeben: false, istRedaktionell: false },
    orderBy: { erstelltAm: "asc" },
    take: limit,
    select: {
      id: true,
      aussehen: true,
      geruch: true,
      geschmack: true,
      wirkung: true,
      konsistenz: true,
      notiz: true,
      erstelltAm: true,
      strain: { select: { handelsname: true, slug: true } },
      charge: { select: { chargenNr: true } },
      autor: { select: { anzeigename: true } },
    },
  });

  return saetze.map((satz) => ({
    id: satz.id,
    handelsname: satz.strain.handelsname,
    slug: satz.strain.slug,
    chargenNr: satz.charge?.chargenNr ?? null,
    autor: satz.autor?.anzeigename ?? null,
    aussehen: satz.aussehen,
    geruch: satz.geruch,
    geschmack: satz.geschmack,
    wirkung: satz.wirkung,
    konsistenz: satz.konsistenz,
    notiz: satz.notiz,
    erstelltAm: satz.erstelltAm,
  }));
}
