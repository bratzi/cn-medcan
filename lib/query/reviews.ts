import "server-only";

import { cache } from "react";

import {
  parseGeschmacksMatrix,
  parseBeschaffenheit,
  parseTerpenIntensitaet,
  type GeschmacksMatrix,
  type Beschaffenheit,
  type TerpenIntensitaet,
} from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";
import type { KartenTerpen } from "@/lib/aromakarte";
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
  geschmacksMatrix: GeschmacksMatrix;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  chargenNr: string | null;
  erstelltAm: Date;
  terpene: KartenTerpen[];
  terpenIntensitaet: TerpenIntensitaet;
  beschaffenheit: Beschaffenheit;
  bildPfad: string | null;
};

/** Gezieltes `select`. Die Geschmacksmatrix braucht die Doppelseite der Startseite (Netzdiagramm). */
const AUSWAHL = {
  id: true,
  strainId: true,
  aussehen: true,
  geruch: true,
  geschmack: true,
  wirkung: true,
  konsistenz: true,
  geschmacksMatrix: true,
  terpenIntensitaet: true,
  beschaffenheit: true,
  feuchtigkeitProzent: true,
  notiz: true,
  instagramReelUrl: true,
  erstelltAm: true,
  strain: {
    select: {
      handelsname: true,
      slug: true,
      herstellerBildPfad: true,
      // Aroma-Karte (Spec Redesign 14): die Terpene der Sorte, für Bögen und Herstellerprofil.
      terpene: {
        orderBy: { rang: "asc" },
        select: { rang: true, konzentrationProzent: true, terpen: { select: { name: true, geschmack: true } } },
      },
    },
  },
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
  geschmacksMatrix: string;
  terpenIntensitaet: string | null;
  beschaffenheit: string | null;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  erstelltAm: Date;
  strain: {
    handelsname: string;
    slug: string;
    herstellerBildPfad: string | null;
    terpene: { rang: number; konzentrationProzent: number | null; terpen: { name: string; geschmack: string } }[];
  };
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
    geschmacksMatrix: parseGeschmacksMatrix(satz.geschmacksMatrix),
    terpenIntensitaet: parseTerpenIntensitaet(satz.terpenIntensitaet),
    beschaffenheit: parseBeschaffenheit(satz.beschaffenheit),
    bildPfad: satz.strain.herstellerBildPfad,
    feuchtigkeitProzent: satz.feuchtigkeitProzent,
    notiz: satz.notiz,
    instagramReelUrl: satz.instagramReelUrl,
    chargenNr: satz.charge?.chargenNr ?? null,
    erstelltAm: satz.erstelltAm,
    terpene: satz.strain.terpene.map((eintrag) => ({
      name: eintrag.terpen.name,
      geschmack: eintrag.terpen.geschmack as GeschmacksKategorie,
      konzentrationProzent: eintrag.konzentrationProzent,
      rang: eintrag.rang,
    })),
  };
}

/**
 * Die neueste freigegebene Bewertung des Betreibers, oder null.
 *
 * `freigegeben` steht hier nicht zur Debatte: eine unfreigegebene Bewertung
 * ist ein Entwurf und gehoert nicht auf die Startseite. `cache`: die
 * Startseite fragt sie zweimal (Kopfzeile und Doppelseite), die Datenbank
 * sieht pro Request eine Abfrage.
 */
export const neuesteRedaktionelleReview = cache(async (): Promise<RedaktionelleReview | null> => {
  const prisma = await getPrisma();
  const satz = await prisma.review.findFirst({
    where: { istRedaktionell: true, freigegeben: true },
    orderBy: { erstelltAm: "desc" },
    select: AUSWAHL,
  });
  return satz ? zuAnsicht(satz as Satz) : null;
});

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
