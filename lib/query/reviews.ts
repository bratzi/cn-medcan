import "server-only";

import { getPrisma } from "@/lib/prisma";

/**
 * Leseschicht fuer die Bewertungen des Betreibers.
 *
 * Getrennt von `lib/query/strains.ts`: dort haengen Bewertungen an einem
 * Produkt, hier stehen sie fuer sich - die neueste eigene Bewertung ist das
 * Kernelement der Startseite und kennt ihr Produkt nur als Verweis.
 *
 * "Eigen" heisst `istRedaktionell = true`. Community-Bewertungen sind die
 * Zweitstimme und tauchen hier bewusst nicht auf.
 */

export type RedaktionelleReview = {
  id: string;
  strainId: string;
  handelsname: string;
  slug: string;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  chargenNr: string | null;
  erstelltAm: Date;
};

/** Gezieltes `select` - die Geschmacksmatrix braucht die Startseite nicht. */
const AUSWAHL = {
  id: true,
  strainId: true,
  aussehen: true,
  geruch: true,
  geschmack: true,
  wirkung: true,
  konsistenz: true,
  feuchtigkeitProzent: true,
  notiz: true,
  instagramReelUrl: true,
  erstelltAm: true,
  strain: { select: { handelsname: true, slug: true } },
  charge: { select: { chargenNr: true } },
} as const;

type Satz = {
  id: string;
  strainId: string;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  erstelltAm: Date;
  strain: { handelsname: string; slug: string };
  charge: { chargenNr: string } | null;
};

function zuAnsicht(satz: Satz): RedaktionelleReview {
  return {
    id: satz.id,
    strainId: satz.strainId,
    handelsname: satz.strain.handelsname,
    slug: satz.strain.slug,
    aussehen: satz.aussehen,
    geruch: satz.geruch,
    geschmack: satz.geschmack,
    wirkung: satz.wirkung,
    konsistenz: satz.konsistenz,
    feuchtigkeitProzent: satz.feuchtigkeitProzent,
    notiz: satz.notiz,
    instagramReelUrl: satz.instagramReelUrl,
    chargenNr: satz.charge?.chargenNr ?? null,
    erstelltAm: satz.erstelltAm,
  };
}

/**
 * Die neueste freigegebene Bewertung des Betreibers, oder null.
 *
 * `freigegeben` steht hier nicht zur Debatte: eine unfreigegebene Bewertung
 * ist ein Entwurf und gehoert nicht auf die Startseite.
 */
export async function neuesteRedaktionelleReview(): Promise<RedaktionelleReview | null> {
  const prisma = await getPrisma();
  const satz = await prisma.review.findFirst({
    where: { istRedaktionell: true, freigegeben: true },
    orderBy: { erstelltAm: "desc" },
    select: AUSWAHL,
  });
  return satz ? zuAnsicht(satz as Satz) : null;
}

/** Die letzten Bewertungen des Betreibers - fuer /reviews (Schritt 6). */
export async function redaktionelleReviews(limit = 20): Promise<RedaktionelleReview[]> {
  const prisma = await getPrisma();
  const saetze = await prisma.review.findMany({
    where: { istRedaktionell: true, freigegeben: true },
    orderBy: { erstelltAm: "desc" },
    take: limit,
    select: AUSWAHL,
  });
  return (saetze as Satz[]).map(zuAnsicht);
}

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
