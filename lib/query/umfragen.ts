import "server-only";

import { getPrisma } from "@/lib/prisma";
import { istOptionHerkunft, istUmfragePhase, type OptionHerkunft, type UmfragePhase } from "@/db/enums";

/**
 * Leseschicht fuer Umfragen.
 *
 * Eine Stelle, an der die Form einer Umfrage fuer die Oberflaeche entsteht -
 * damit Startseite, /umfragen und /admin dieselben Zahlen zeigen und nicht
 * drei leicht verschiedene Abfragen auseinanderlaufen.
 *
 * Alle Abfragen haben ein `take`, und Stimmen werden in der Datenbank
 * gezaehlt (`groupBy`), nicht durch Laden und Zaehlen in JS: jede Query ist
 * ein Sub-Request, und der Isolate hat 128 MB.
 */

/** Obergrenzen. Eine Runde hat 3-4 Kandidaten; das hier ist reichlich. */
const MAX_OPTIONEN = 50;
const MAX_VORSCHLAEGE = 200;

export type UmfrageOptionAnsicht = {
  id: string;
  strainId: string;
  handelsname: string;
  slug: string;
  reihenfolge: number;
  herkunft: OptionHerkunft;
  istGewinner: boolean;
  /**
   * Stimmen dieser Option. Bei GESETZT immer null, nicht 0 - null heisst
   * "steht nicht zur Wahl", 0 hiesse "niemand wollte sie". Die Oberflaeche
   * muss das unterscheiden koennen, sonst wirkt die Abstimmung manipuliert.
   */
  stimmen: number | null;
  ergebnisReviewId: string | null;
};

export type UmfrageAnsicht = {
  id: string;
  titel: string;
  beschreibung: string | null;
  phase: UmfragePhase;
  startAm: Date;
  vorschlagBisAm: Date | null;
  endetAm: Date | null;
  communityPlaetze: number;
  optionen: UmfrageOptionAnsicht[];
  /** Summe der abgegebenen Stimmen in dieser Runde. */
  stimmenGesamt: number;
};

/**
 * Die laufende Umfrage, oder null.
 *
 * "Laufend" heisst `aktiv = 'AKTIV'`. Dass es davon hoechstens eine gibt,
 * sichert der Unique-Index auf der Spalte - nicht diese Funktion.
 */
export async function aktiveUmfrage(): Promise<UmfrageAnsicht | null> {
  const prisma = await getPrisma();
  const satz = await prisma.umfrage.findUnique({
    where: { aktiv: "AKTIV" },
    select: { id: true },
  });
  if (!satz) return null;
  return umfrageLaden(satz.id);
}

/** Eine bestimmte Umfrage mit Kandidaten und Stimmen. */
export async function umfrageLaden(umfrageId: string): Promise<UmfrageAnsicht | null> {
  const prisma = await getPrisma();

  const [umfrage, stimmenJeOption] = await Promise.all([
    prisma.umfrage.findUnique({
      where: { id: umfrageId },
      select: {
        id: true,
        titel: true,
        beschreibung: true,
        phase: true,
        startAm: true,
        vorschlagBisAm: true,
        endetAm: true,
        communityPlaetze: true,
        optionen: {
          select: {
            id: true,
            strainId: true,
            reihenfolge: true,
            herkunft: true,
            istGewinner: true,
            ergebnisReviewId: true,
            strain: { select: { handelsname: true, slug: true } },
          },
          orderBy: { reihenfolge: "asc" },
          take: MAX_OPTIONEN,
        },
      },
    }),
    prisma.stimme.groupBy({
      by: ["optionId"],
      where: { umfrageId },
      _count: { _all: true },
    }),
  ]);

  if (!umfrage) return null;

  const zaehler = new Map(stimmenJeOption.map((z) => [z.optionId, z._count._all]));

  const optionen = umfrage.optionen.map((o) => {
    // Werte aus der Datenbank sind fuer Prisma nur `string`. Ein Satz, der an
    // den Triggern vorbei eingespielt wurde, gilt hier als COMMUNITY - also
    // als das Abstimmbare, aber Sichtbare, nicht als gesetzter Platz.
    const herkunft: OptionHerkunft = istOptionHerkunft(o.herkunft) ? o.herkunft : "COMMUNITY";
    return {
      id: o.id,
      strainId: o.strainId,
      handelsname: o.strain.handelsname,
      slug: o.strain.slug,
      reihenfolge: o.reihenfolge,
      herkunft,
      istGewinner: o.istGewinner,
      stimmen: herkunft === "GESETZT" ? null : (zaehler.get(o.id) ?? 0),
      ergebnisReviewId: o.ergebnisReviewId,
    };
  });

  return {
    id: umfrage.id,
    titel: umfrage.titel,
    beschreibung: umfrage.beschreibung,
    phase: istUmfragePhase(umfrage.phase) ? umfrage.phase : "VORSCHLAG",
    startAm: umfrage.startAm,
    vorschlagBisAm: umfrage.vorschlagBisAm,
    endetAm: umfrage.endetAm,
    communityPlaetze: umfrage.communityPlaetze,
    optionen,
    stimmenGesamt: stimmenJeOption.reduce((summe, z) => summe + z._count._all, 0),
  };
}

/**
 * Die Option, die ein Mitglied in dieser Runde gewaehlt hat, oder null.
 *
 * Getrennt von `umfrageLaden`, weil das Ergebnis nutzerbezogen ist: eine
 * Umfrage darf gecacht werden, die eigene Stimme nie.
 */
export async function eigeneStimme(
  umfrageId: string,
  mitgliedId: string,
): Promise<string | null> {
  const prisma = await getPrisma();
  const stimme = await prisma.stimme.findUnique({
    where: { umfrageId_mitgliedId: { umfrageId, mitgliedId } },
    select: { optionId: true },
  });
  return stimme?.optionId ?? null;
}

export type VorschlagAnsicht = {
  id: string;
  strainId: string;
  handelsname: string;
  slug: string;
  begruendung: string | null;
  uebernommen: boolean;
  vonAnzeigename: string;
  erstelltAm: Date;
};

/** Die Vorschlaege einer Runde - fuer /admin und die Umfrageseite. */
export async function vorschlaegeLaden(umfrageId: string): Promise<VorschlagAnsicht[]> {
  const prisma = await getPrisma();
  const saetze = await prisma.umfrageVorschlag.findMany({
    where: { umfrageId },
    select: {
      id: true,
      strainId: true,
      begruendung: true,
      uebernommen: true,
      erstelltAm: true,
      strain: { select: { handelsname: true, slug: true } },
      mitglied: { select: { anzeigename: true } },
    },
    // Offene Vorschlaege zuerst - das ist die Arbeit, die ansteht.
    orderBy: [{ uebernommen: "asc" }, { erstelltAm: "asc" }],
    take: MAX_VORSCHLAEGE,
  });

  return saetze.map((v) => ({
    id: v.id,
    strainId: v.strainId,
    handelsname: v.strain.handelsname,
    slug: v.strain.slug,
    begruendung: v.begruendung,
    uebernommen: v.uebernommen,
    vonAnzeigename: v.mitglied.anzeigename,
    erstelltAm: v.erstelltAm,
  }));
}

// ---------------------------------------------------------------------------
//  Uebersicht
// ---------------------------------------------------------------------------

/** Obergrenze fuer die Runden-Uebersicht. */
const MAX_UMFRAGEN = 30;

export type UmfrageUebersicht = {
  id: string;
  titel: string;
  phase: UmfragePhase;
  startAm: Date;
  endetAm: Date | null;
  istAktiv: boolean;
  /** Nur die markierten Gewinner - der Rest interessiert in der Liste nicht. */
  gewinner: { handelsname: string; slug: string }[];
};

/**
 * Alle Runden, neueste zuerst.
 *
 * Eine Query mit `include` statt einer Schleife ueber die Runden: jede Query
 * ist ein Sub-Request, und auf Free sind 50 davon das Budget.
 */
export async function umfragenUebersicht(limit = MAX_UMFRAGEN): Promise<UmfrageUebersicht[]> {
  const prisma = await getPrisma();
  const saetze = await prisma.umfrage.findMany({
    orderBy: { startAm: "desc" },
    take: limit,
    select: {
      id: true,
      titel: true,
      phase: true,
      startAm: true,
      endetAm: true,
      aktiv: true,
      optionen: {
        where: { istGewinner: true },
        select: { strain: { select: { handelsname: true, slug: true } } },
        orderBy: { reihenfolge: "asc" },
        take: MAX_OPTIONEN,
      },
    },
  });

  return saetze.map((u) => ({
    id: u.id,
    titel: u.titel,
    phase: istUmfragePhase(u.phase) ? u.phase : "VORSCHLAG",
    startAm: u.startAm,
    endetAm: u.endetAm,
    istAktiv: u.aktiv === "AKTIV",
    gewinner: u.optionen.map((o) => ({
      handelsname: o.strain.handelsname,
      slug: o.strain.slug,
    })),
  }));
}
