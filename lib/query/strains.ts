import type { Prisma } from "@/lib/generated/prisma/client";
import {
  istBestandStatus,
  istBestrahlung,
  istDarreichungsform,
  istGeschmacksKategorie,
  istKultivarTyp,
  istRezeptStatus,
  type Darreichungsform,
  type GeschmacksKategorie,
  type KultivarTyp,
  type RezeptStatus,
} from "@/db/enums";
import { getPrisma } from "@/lib/prisma";

import { TREFFER_PRO_SEITE, type StrainFilter } from "./filter";

/**
 * Wie viele Bestandszeilen je Produkt fuer die Liste geladen werden.
 *
 * Entscheidung: Prisma kann in einer `findMany`-Abfrage keine Aggregate ueber
 * eine Relation mitliefern (kein "min(preis) der sichtbaren Bestaende" im
 * `select`). Ein zweiter `groupBy` ueber alle Treffer waere ein zusaetzlicher
 * Sub-Request und muesste in JS wieder zusammengefuehrt werden. Deshalb holen
 * wir die Bestaende pro Zeile begrenzt (`take`) mit und verdichten sie in
 * TypeScript - beschraenkt und damit auch auf dem Free-Tier (10 ms CPU)
 * unkritisch, weil je Seite maximal TREFFER_PRO_SEITE * BESTAENDE_PRO_ZEILE
 * kleine Objekte verarbeitet werden.
 */
const BESTAENDE_PRO_ZEILE = 30;

/**
 * Fachkreis-Gate auf Bestandsebene.
 *
 * Grundlage ist § 10 HWG: Werbung fuer verschreibungspflichtige Arzneimittel -
 * und damit auch die Nennung von Preisen und Verfuegbarkeiten - ist nur
 * gegenueber Fachkreisen zulaessig. Ohne Fachkreis-Recht duerfen Preise und
 * Bestaende ausschliesslich aus Zeilen mit `nurFuerFachkreise: false` stammen.
 *
 * Diese Funktion ist die EINZIGE Stelle, die diese Bedingung formuliert, damit
 * sie in Filter (`preisMax`, `nurVerfuegbar`, `apotheke`), Ausgabe und Facetten
 * identisch ist.
 */
function bestandSichtbarkeit(fachkreis: boolean): Prisma.PharmacyStockWhereInput {
  return fachkreis ? {} : { nurFuerFachkreise: false };
}

/**
 * Prozentwerte sind auf D1 `Float`, nicht mehr `Decimal`. Die Umwandlung
 * bleibt trotzdem bestehen: SQLite speichert Zahlen locker typisiert, und ein
 * `NaN` aus einem schlecht eingespielten Datensatz soll in der Oberflaeche
 * als "keine Angabe" landen, nicht als "NaN %".
 */
function zuZahl(wert: number | null | undefined): number | null {
  if (wert === null || wert === undefined) return null;
  return Number.isFinite(wert) ? wert : null;
}

function zuZahlPflicht(wert: number): number {
  return zuZahl(wert) ?? 0;
}

// ---------------------------------------------------------------------------
//  Verengung der Werteliste-Spalten
//
//  Auf D1 sind die sieben Wertelisten String-Spalten (SQLite kennt keine
//  Enums), Prisma gibt sie folglich als `string` heraus. Die UI-Typen weiter
//  unten arbeiten aber mit Unions, damit `Record<Enum, Label>` in lib/labels.ts
//  vollstaendig bleibt und ein fehlendes Label `tsc` bricht.
//
//  Diese Grenze ist genau hier - nicht in den Komponenten. Ein Wert, der nicht
//  in der Liste steht, kann regulaer nicht entstehen: die CHECK-Constraints in
//  db/constraints.sql lassen ihn nicht in die Datenbank. Erreichbar ist der
//  Fallback also nur ueber Daten, die an den Constraints vorbei eingespielt
//  wurden. Dann ist ein neutraler Anzeigewert richtig - nicht ein Absturz der
//  ganzen Seite wegen einer einzelnen Zeile.
// ---------------------------------------------------------------------------

function verenge<T extends string>(
  pruefe: (wert: unknown) => wert is T,
  ersatz: T
): (wert: string) => T {
  return (wert) => (pruefe(wert) ? wert : ersatz);
}

const alsKultivarTyp = verenge(istKultivarTyp, "HYBRID");
const alsDarreichungsform = verenge(istDarreichungsform, "BLUETE");
const alsBestrahlung = verenge(istBestrahlung, "UNBEKANNT");
const alsRezeptStatus = verenge(istRezeptStatus, "BEIDES");
const alsBestandStatus = verenge(istBestandStatus, "NICHT_LIEFERBAR");
const alsGeschmacksKategorie = verenge(istGeschmacksKategorie, "ERDIG");

// ---------------------------------------------------------------------------
//  Stabile Ausgabetypen - die UI baut gegen diese, nicht gegen Prisma-Payloads.
// ---------------------------------------------------------------------------

export type TerpenEintrag = {
  name: string;
  aromaProfil: string;
  geschmack: GeschmacksKategorie;
  konzentrationProzent: number | null;
  rang: number;
};

export type StrainListenEintrag = {
  id: string;
  slug: string;
  handelsname: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  genetik: string | null;
  thcMinProzent: number;
  thcMaxProzent: number;
  cbdMinProzent: number;
  cbdMaxProzent: number;
  bestrahlung: string;
  anbauland: string | null;
  herstellerBildPfad: string | null;
  herstellerName: string | null;
  /** Dominante Terpene, Rang 1 bis 3, aufsteigend nach Rang. */
  terpene: TerpenEintrag[];
  /** Guenstigster sichtbarer Preis in Cent pro Gramm, sonst null. */
  guenstigsterPreisCent: number | null;
  /** Zahl der Apotheken mit Status VERFUEGBAR (nur sichtbare Bestaende). */
  anzahlApothekenVerfuegbar: number;
  /** True, wenn Preise nur wegen des Fachkreis-Gates fehlen. */
  preisNurFuerFachkreise: boolean;
};

export type StrainListe = {
  eintraege: StrainListenEintrag[];
  gesamt: number;
  seite: number;
  seitenAnzahl: number;
};

export type BestandEintrag = {
  id: string;
  packungGramm: number;
  preisProGrammCent: number | null;
  bestandGramm: number | null;
  status: string;
  standAm: Date;
  apotheke: {
    name: string;
    slug: string;
    ort: string;
    lieferzeitTageMin: number;
    lieferzeitTageMax: number;
    rezeptStatus: RezeptStatus;
    eRezeptTokenUpload: boolean;
  };
};

export type ChargeEintrag = {
  id: string;
  chargenNr: string;
  analysedatum: Date | null;
  thcIst: number | null;
  cbdIst: number | null;
  laborBericht: string | null;
  verfallsdatum: Date | null;
};

export type ReviewEintrag = {
  id: string;
  /** true = Bewertung des Betreibers, false = Community (Zweitstimme). */
  istRedaktionell: boolean;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  feuchtigkeitProzent: number | null;
  /** Rohes JSON - mit `parseGeschmacksMatrix` aus lib/query/bewertung.ts lesen. */
  geschmacksMatrix: unknown;
  /** Rohes JSON - mit `parseTerpenIntensitaet` lesen. */
  terpenIntensitaet: unknown;
  notiz: string | null;
  instagramReelUrl: string | null;
  chargenNr: string | null;
  erstelltAm: Date;
};

export type UnternehmenEintrag = {
  name: string;
  land: string | null;
  website: string | null;
};

export type StrainDetail = {
  id: string;
  slug: string;
  handelsname: string;
  pzn: string | null;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  genetik: string | null;
  thcMinProzent: number;
  thcMaxProzent: number;
  cbdMinProzent: number;
  cbdMaxProzent: number;
  bestrahlung: string;
  anbauland: string | null;
  herstellerBildPfad: string | null;
  beschreibung: string | null;
  verschreibungspflichtig: boolean;
  bfarmGelistet: boolean;
  hersteller: UnternehmenEintrag | null;
  importeur: UnternehmenEintrag | null;
  /** Vollstaendiges Terpenprofil, alle Raenge. */
  terpene: TerpenEintrag[];
  bestaende: BestandEintrag[];
  guenstigsterPreisCent: number | null;
  anzahlApothekenVerfuegbar: number;
  chargen: ChargeEintrag[];
  reviews: ReviewEintrag[];
  aktualisiertAm: Date;
};

// ---------------------------------------------------------------------------
//  Liste
// ---------------------------------------------------------------------------

function baueWhere(
  filter: StrainFilter,
  fachkreis: boolean
): Prisma.StrainWhereInput {
  const bedingungen: Prisma.StrainWhereInput = { aktiv: true };

  if (filter.q) {
    // SQLite/D1 kennt `mode: "insensitive"` nicht, und Prisma bildet dort
    // auch kein LOWER() in der Query ab. Stattdessen sucht die Abfrage in
    // der kleingeschriebenen Spalte `suchtext` (Handelsname, Kultivarname
    // und Genetik zusammengefasst, beim Schreiben gefuellt) mit ebenfalls
    // kleingeschriebener Eingabe. Ein OR ueber drei Spalten entfaellt damit.
    bedingungen.suchtext = { contains: filter.q.toLowerCase() };
  }

  if (filter.typ.length > 0) bedingungen.kultivarTyp = { in: filter.typ };
  if (filter.form.length > 0)
    bedingungen.darreichungsform = { in: filter.form };

  // Intervall-Ueberschneidung, nicht Enthaltensein: ein Produkt mit 18-24 %
  // passt zu einem Filter 20-30 %, weil sich die Spannen ueberlappen.
  if (filter.thcMin > 0) bedingungen.thcMaxProzent = { gte: filter.thcMin };
  if (filter.thcMax < 100) bedingungen.thcMinProzent = { lte: filter.thcMax };

  if (filter.geschmack.length > 0) {
    // Dominantes Terpen = Rang 1.
    bedingungen.terpene = {
      some: { rang: 1, terpen: { geschmack: { in: filter.geschmack } } },
    };
  }

  // Bestandsbezogene Filter laufen alle ueber `bestaende.some` und tragen
  // immer die Sichtbarkeitsbedingung mit - sonst wuerde ein Preisfilter
  // Treffer verraten, deren Preis der Nutzer nicht sehen darf.
  const bestandsFilter: Prisma.PharmacyStockWhereInput[] = [];
  if (filter.nurVerfuegbar) bestandsFilter.push({ status: "VERFUEGBAR" });
  if (filter.apotheke.length > 0)
    bestandsFilter.push({ pharmacy: { slug: { in: filter.apotheke } } });
  if (filter.preisMax !== undefined)
    bestandsFilter.push({ preisProGrammCent: { lte: filter.preisMax, not: null } });

  if (bestandsFilter.length > 0) {
    bedingungen.bestaende = {
      some: {
        ...bestandSichtbarkeit(fachkreis),
        AND: bestandsFilter,
      },
    };
  }

  return bedingungen;
}

function baueOrderBy(
  sortierung: StrainFilter["sortierung"]
): Prisma.StrainOrderByWithRelationInput[] {
  switch (sortierung) {
    case "thc_absteigend":
      return [{ thcMaxProzent: "desc" }, { handelsname: "asc" }];
    case "thc_aufsteigend":
      return [{ thcMinProzent: "asc" }, { handelsname: "asc" }];
    case "name":
      return [{ handelsname: "asc" }];
    case "preis_aufsteigend":
      // Der guenstigste Preis liegt in einer Relation und ist ein Aggregat -
      // Prisma kann darauf nicht in `orderBy` sortieren. Wir sortieren die
      // geladene Seite deshalb nachtraeglich in TypeScript (siehe unten) und
      // halten die DB-Reihenfolge stabil, damit die Paginierung deterministisch
      // bleibt.
      return [{ handelsname: "asc" }];
    case "relevanz":
    default:
      // Ohne Volltextindex ist "Relevanz" bewusst eine stabile, fachlich
      // sinnvolle Default-Sortierung: zuletzt aktualisiert zuerst.
      return [{ aktualisiertAm: "desc" }, { handelsname: "asc" }];
  }
}

const listenSelect = (fachkreis: boolean) =>
  ({
    id: true,
    slug: true,
    handelsname: true,
    kultivarName: true,
    kultivarTyp: true,
    darreichungsform: true,
    genetik: true,
    thcMinProzent: true,
    thcMaxProzent: true,
    cbdMinProzent: true,
    cbdMaxProzent: true,
    bestrahlung: true,
    anbauland: true,
    herstellerBildPfad: true,
    hersteller: { select: { name: true } },
    terpene: {
      where: { rang: { lte: 3 } },
      orderBy: { rang: "asc" },
      select: {
        rang: true,
        konzentrationProzent: true,
        terpen: { select: { name: true, aromaProfil: true, geschmack: true } },
      },
    },
    bestaende: {
      where: bestandSichtbarkeit(fachkreis),
      take: BESTAENDE_PRO_ZEILE,
      select: {
        preisProGrammCent: true,
        status: true,
        pharmacyId: true,
      },
    },
    _count: { select: { bestaende: true } },
  }) satisfies Prisma.StrainSelect;

type ListenZeile = {
  id: string;
  slug: string;
  handelsname: string;
  kultivarName: string | null;
  kultivarTyp: string;
  darreichungsform: string;
  genetik: string | null;
  thcMinProzent: number;
  thcMaxProzent: number;
  cbdMinProzent: number;
  cbdMaxProzent: number;
  bestrahlung: string;
  anbauland: string | null;
  herstellerBildPfad: string | null;
  hersteller: { name: string } | null;
  terpene: {
    rang: number;
    konzentrationProzent: number | null;
    terpen: { name: string; aromaProfil: string; geschmack: string };
  }[];
  bestaende: {
    preisProGrammCent: number | null;
    status: string;
    pharmacyId: string;
  }[];
  _count: { bestaende: number };
};

/** Verdichtet die mitgeladenen Bestandszeilen zu den Kennzahlen der Kachel. */
function verdichteBestaende(
  bestaende: readonly {
    preisProGrammCent: number | null;
    status: string;
    pharmacyId: string;
  }[]
): { guenstigsterPreisCent: number | null; anzahlApothekenVerfuegbar: number } {
  let guenstigster: number | null = null;
  const apotheken = new Set<string>();
  for (const bestand of bestaende) {
    if (
      bestand.preisProGrammCent !== null &&
      (guenstigster === null || bestand.preisProGrammCent < guenstigster)
    ) {
      guenstigster = bestand.preisProGrammCent;
    }
    if (bestand.status === "VERFUEGBAR") apotheken.add(bestand.pharmacyId);
  }
  return {
    guenstigsterPreisCent: guenstigster,
    anzahlApothekenVerfuegbar: apotheken.size,
  };
}

function zuListenEintrag(zeile: ListenZeile): StrainListenEintrag {
  const { guenstigsterPreisCent, anzahlApothekenVerfuegbar } =
    verdichteBestaende(zeile.bestaende);
  return {
    id: zeile.id,
    slug: zeile.slug,
    handelsname: zeile.handelsname,
    kultivarName: zeile.kultivarName,
    kultivarTyp: alsKultivarTyp(zeile.kultivarTyp),
    darreichungsform: alsDarreichungsform(zeile.darreichungsform),
    genetik: zeile.genetik,
    thcMinProzent: zuZahlPflicht(zeile.thcMinProzent),
    thcMaxProzent: zuZahlPflicht(zeile.thcMaxProzent),
    cbdMinProzent: zuZahlPflicht(zeile.cbdMinProzent),
    cbdMaxProzent: zuZahlPflicht(zeile.cbdMaxProzent),
    bestrahlung: alsBestrahlung(zeile.bestrahlung),
    anbauland: zeile.anbauland,
    herstellerBildPfad: zeile.herstellerBildPfad,
    herstellerName: zeile.hersteller?.name ?? null,
    terpene: zeile.terpene.map((eintrag) => ({
      name: eintrag.terpen.name,
      aromaProfil: eintrag.terpen.aromaProfil,
      geschmack: alsGeschmacksKategorie(eintrag.terpen.geschmack),
      konzentrationProzent: zuZahl(eintrag.konzentrationProzent),
      rang: eintrag.rang,
    })),
    guenstigsterPreisCent,
    anzahlApothekenVerfuegbar,
    // Es gibt Bestaende, aber keinen sichtbaren: das Gate ist der Grund.
    preisNurFuerFachkreise:
      guenstigsterPreisCent === null && zeile._count.bestaende > 0,
  };
}

/**
 * Katalogliste plus Gesamtzahl.
 * Genau ZWEI Datenbankabfragen, gebuendelt in einem `$transaction`-Block -
 * also ein Roundtrip-Block und zwei Sub-Requests.
 */
export async function ladeStrainListe(
  filter: StrainFilter,
  fachkreis: boolean
): Promise<StrainListe> {
  const prisma = await getPrisma();
  const where = baueWhere(filter, fachkreis);
  const seite = Math.max(1, filter.seite);

  // Zwei parallele Abfragen (zwei Sub-Requests). Bewusst `Promise.all` statt
  // `$transaction`: ein Transaktions-Array verliert die Typinferenz des
  // `select`, und eine Leseabfrage braucht hier keine Transaktionsklammer.
  const [zeilen, gesamt] = await Promise.all([
    prisma.strain.findMany({
      where,
      select: listenSelect(fachkreis),
      orderBy: baueOrderBy(filter.sortierung),
      skip: (seite - 1) * TREFFER_PRO_SEITE,
      take: TREFFER_PRO_SEITE,
    }),
    prisma.strain.count({ where }),
  ]);

  const eintraege = zeilen.map(zuListenEintrag);

  if (filter.sortierung === "preis_aufsteigend") {
    // Siehe `baueOrderBy`: Sortierung ueber ein Relations-Aggregat ist in
    // Prisma nicht moeglich, deshalb hier auf der geladenen Seite. Zeilen ohne
    // sichtbaren Preis wandern nach hinten.
    eintraege.sort((a, b) => {
      const links = a.guenstigsterPreisCent ?? Number.POSITIVE_INFINITY;
      const rechts = b.guenstigsterPreisCent ?? Number.POSITIVE_INFINITY;
      if (links !== rechts) return links - rechts;
      return a.handelsname.localeCompare(b.handelsname, "de");
    });
  }

  return {
    eintraege,
    gesamt,
    seite,
    seitenAnzahl: Math.max(1, Math.ceil(gesamt / TREFFER_PRO_SEITE)),
  };
}

// ---------------------------------------------------------------------------
//  Detail
// ---------------------------------------------------------------------------

/** Ein Produkt mit vollem Profil. `null`, wenn unbekannt oder inaktiv. */
export async function ladeStrainDetail(
  slug: string,
  fachkreis: boolean
): Promise<StrainDetail | null> {
  const prisma = await getPrisma();

  const zeile = await prisma.strain.findFirst({
    where: { slug, aktiv: true },
    select: {
      id: true,
      slug: true,
      handelsname: true,
      pzn: true,
      kultivarName: true,
      kultivarTyp: true,
      darreichungsform: true,
      genetik: true,
      thcMinProzent: true,
      thcMaxProzent: true,
      cbdMinProzent: true,
      cbdMaxProzent: true,
      bestrahlung: true,
      anbauland: true,
      herstellerBildPfad: true,
      beschreibung: true,
      verschreibungspflichtig: true,
      bfarmGelistet: true,
      aktualisiertAm: true,
      hersteller: { select: { name: true, land: true, website: true } },
      importeur: { select: { name: true, land: true, website: true } },
      terpene: {
        orderBy: { rang: "asc" },
        select: {
          rang: true,
          konzentrationProzent: true,
          terpen: {
            select: { name: true, aromaProfil: true, geschmack: true },
          },
        },
      },
      bestaende: {
        // § 10 HWG: ohne Fachkreis-Recht nur oeffentlich sichtbare Zeilen.
        where: bestandSichtbarkeit(fachkreis),
        orderBy: [{ status: "asc" }, { preisProGrammCent: "asc" }],
        take: 50,
        select: {
          id: true,
          packungGramm: true,
          preisProGrammCent: true,
          bestandGramm: true,
          status: true,
          standAm: true,
          pharmacyId: true,
          pharmacy: {
            select: {
              name: true,
              slug: true,
              ort: true,
              lieferzeitTageMin: true,
              lieferzeitTageMax: true,
              rezeptStatus: true,
              eRezeptTokenUpload: true,
            },
          },
        },
      },
      chargen: {
        orderBy: { analysedatum: "desc" },
        take: 20,
        select: {
          id: true,
          chargenNr: true,
          analysedatum: true,
          thcIst: true,
          cbdIst: true,
          laborBericht: true,
          verfallsdatum: true,
        },
      },
      reviews: {
        where: { freigegeben: true },
        orderBy: { erstelltAm: "desc" },
        take: 20,
        select: {
          id: true,
          istRedaktionell: true,
          aussehen: true,
          geruch: true,
          geschmack: true,
          wirkung: true,
          konsistenz: true,
          feuchtigkeitProzent: true,
          geschmacksMatrix: true,
          terpenIntensitaet: true,
          notiz: true,
          instagramReelUrl: true,
          erstelltAm: true,
          charge: { select: { chargenNr: true } },
        },
      },
    },
  });

  if (!zeile) return null;

  const { guenstigsterPreisCent, anzahlApothekenVerfuegbar } =
    verdichteBestaende(
      zeile.bestaende.map((bestand) => ({
        preisProGrammCent: bestand.preisProGrammCent,
        status: bestand.status,
        pharmacyId: bestand.pharmacyId,
      }))
    );

  return {
    id: zeile.id,
    slug: zeile.slug,
    handelsname: zeile.handelsname,
    pzn: zeile.pzn,
    kultivarName: zeile.kultivarName,
    kultivarTyp: alsKultivarTyp(zeile.kultivarTyp),
    darreichungsform: alsDarreichungsform(zeile.darreichungsform),
    genetik: zeile.genetik,
    thcMinProzent: zuZahlPflicht(zeile.thcMinProzent),
    thcMaxProzent: zuZahlPflicht(zeile.thcMaxProzent),
    cbdMinProzent: zuZahlPflicht(zeile.cbdMinProzent),
    cbdMaxProzent: zuZahlPflicht(zeile.cbdMaxProzent),
    bestrahlung: alsBestrahlung(zeile.bestrahlung),
    anbauland: zeile.anbauland,
    herstellerBildPfad: zeile.herstellerBildPfad,
    beschreibung: zeile.beschreibung,
    verschreibungspflichtig: zeile.verschreibungspflichtig,
    bfarmGelistet: zeile.bfarmGelistet,
    hersteller: zeile.hersteller,
    importeur: zeile.importeur,
    terpene: zeile.terpene.map((eintrag) => ({
      name: eintrag.terpen.name,
      aromaProfil: eintrag.terpen.aromaProfil,
      geschmack: alsGeschmacksKategorie(eintrag.terpen.geschmack),
      konzentrationProzent: zuZahl(eintrag.konzentrationProzent),
      rang: eintrag.rang,
    })),
    bestaende: zeile.bestaende.map((bestand) => ({
      id: bestand.id,
      packungGramm: bestand.packungGramm,
      preisProGrammCent: bestand.preisProGrammCent,
      bestandGramm: zuZahl(bestand.bestandGramm),
      status: alsBestandStatus(bestand.status),
      standAm: bestand.standAm,
      apotheke: {
        ...bestand.pharmacy,
        rezeptStatus: alsRezeptStatus(bestand.pharmacy.rezeptStatus),
      },
    })),
    guenstigsterPreisCent,
    anzahlApothekenVerfuegbar,
    chargen: zeile.chargen.map((charge) => ({
      id: charge.id,
      chargenNr: charge.chargenNr,
      analysedatum: charge.analysedatum,
      thcIst: zuZahl(charge.thcIst),
      cbdIst: zuZahl(charge.cbdIst),
      laborBericht: charge.laborBericht,
      verfallsdatum: charge.verfallsdatum,
    })),
    reviews: zeile.reviews.map((review) => ({
      id: review.id,
      istRedaktionell: review.istRedaktionell,
      aussehen: review.aussehen,
      geruch: review.geruch,
      geschmack: review.geschmack,
      wirkung: review.wirkung,
      konsistenz: review.konsistenz,
      feuchtigkeitProzent: zuZahl(review.feuchtigkeitProzent),
      geschmacksMatrix: review.geschmacksMatrix,
      terpenIntensitaet: review.terpenIntensitaet,
      notiz: review.notiz,
      instagramReelUrl: review.instagramReelUrl,
      chargenNr: review.charge?.chargenNr ?? null,
      erstelltAm: review.erstelltAm,
    })),
    aktualisiertAm: zeile.aktualisiertAm,
  };
}

// ---------------------------------------------------------------------------
//  Facetten fuer die Filterleiste
// ---------------------------------------------------------------------------

export type Facette<T extends string> = { wert: T; anzahl: number };

export type FilterFacetten = {
  typen: Facette<KultivarTyp>[];
  formen: Facette<Darreichungsform>[];
  /** Alle acht Geschmacksachsen, Anzahl = Produkte mit diesem dominanten Terpen. */
  geschmaecker: Facette<GeschmacksKategorie>[];
  thcSpanne: { min: number; max: number };
  preisSpanneCent: { min: number | null; max: number | null };
  apotheken: { slug: string; name: string; ort: string }[];
};

const ALLE_GESCHMAECKER: GeschmacksKategorie[] = [
  "DIESEL",
  "ZITRUS",
  "ERDIG",
  "SUESS",
  "WUERZIG",
  "BLUMIG",
  "HOLZIG",
  "KRAEUTRIG",
];

/**
 * Werte fuer die Filterleiste.
 * SIEBEN Datenbankabfragen, gebuendelt in einem `$transaction`-Block.
 *
 * TODO Caching: `unstable_cache` aus `next/cache` existiert in Next 16.3.6 und
 * waere fachlich richtig (Daten fuer alle Nutzer gleich, duerfen Minuten alt
 * sein). Es ist hier bewusst NICHT eingebaut: laut
 * .claude/skills/edge-stack-master.md, Abschnitt 6, braucht ISR unter
 * @opennextjs/cloudflare zusaetzliche Infrastruktur (R2-Binding
 * NEXT_INC_CACHE_R2_BUCKET, Service-Binding WORKER_SELF_REFERENCE, ggf.
 * NEXT_CACHE_DO_QUEUE) in wrangler.jsonc und der OpenNext-Cache-Konfiguration.
 * Diese Dateien liegen ausserhalb des Auftrags dieser Abfrageschicht - ein
 * Caching-Aufruf ohne die Bindings "funktioniert" nur in `next dev` und fiele
 * im Worker still um. Caching also gemeinsam mit den Bindings nachziehen,
 * dann diese Funktion in `unstable_cache` wickeln (Tag z. B. "facetten").
 */
export async function ladeFilterFacetten(
  fachkreis: boolean
): Promise<FilterFacetten> {
  const prisma = await getPrisma();
  const sichtbar = bestandSichtbarkeit(fachkreis);

  const [
    typGruppen,
    formGruppen,
    dominanteTerpene,
    terpenListe,
    thcAggregat,
    preisAggregat,
    apotheken,
    // `Promise.all` statt `$transaction`: gleiche Zahl an Sub-Requests (sieben,
    // parallel), aber Prisma behaelt die genaue Typinferenz der `groupBy`-
    // Aggregate, die ein `$transaction`-Array verliert.
  ] = await Promise.all([
    prisma.strain.groupBy({
      by: ["kultivarTyp"],
      where: { aktiv: true },
      orderBy: { kultivarTyp: "asc" },
      _count: { _all: true },
    }),
    prisma.strain.groupBy({
      by: ["darreichungsform"],
      where: { aktiv: true },
      orderBy: { darreichungsform: "asc" },
      _count: { _all: true },
    }),
    // Zaehlung je dominantem Terpen. `groupBy` kann nicht nach einem
    // Relationsfeld (terpen.geschmack) gruppieren, deshalb nach terpenId und
    // Zuordnung zur Geschmacksachse ueber die kleine Terpen-Tabelle.
    prisma.strainTerpen.groupBy({
      by: ["terpenId"],
      where: { rang: 1, strain: { aktiv: true } },
      orderBy: { terpenId: "asc" },
      _count: { _all: true },
    }),
    prisma.terpen.findMany({ select: { id: true, geschmack: true }, take: 200 }),
    prisma.strain.aggregate({
      where: { aktiv: true },
      _min: { thcMinProzent: true },
      _max: { thcMaxProzent: true },
    }),
    prisma.pharmacyStock.aggregate({
      where: {
        ...sichtbar,
        preisProGrammCent: { not: null },
        strain: { aktiv: true },
      },
      _min: { preisProGrammCent: true },
      _max: { preisProGrammCent: true },
    }),
    prisma.pharmacy.findMany({
      where: { bestaende: { some: { ...sichtbar, strain: { aktiv: true } } } },
      select: { slug: true, name: true, ort: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  const geschmackJeTerpen = new Map<string, GeschmacksKategorie>(
    terpenListe
      .filter((terpen) => istGeschmacksKategorie(terpen.geschmack))
      .map((terpen) => [terpen.id, terpen.geschmack as GeschmacksKategorie])
  );
  const geschmacksZaehler = new Map<GeschmacksKategorie, number>(
    ALLE_GESCHMAECKER.map((achse) => [achse, 0])
  );
  for (const gruppe of dominanteTerpene) {
    const achse = geschmackJeTerpen.get(gruppe.terpenId);
    if (!achse) continue;
    geschmacksZaehler.set(
      achse,
      (geschmacksZaehler.get(achse) ?? 0) + gruppe._count._all
    );
  }

  return {
    // Facetten filtern unbekannte Werte heraus, statt sie auf einen Ersatz zu
    // ziehen: ein Filterknopf fuer einen Wert, den es nicht gibt, waere
    // schlimmer als eine fehlende Zeile in der Facettenliste.
    typen: typGruppen
      .filter((gruppe) => istKultivarTyp(gruppe.kultivarTyp))
      .map((gruppe) => ({
        wert: gruppe.kultivarTyp as KultivarTyp,
        anzahl: gruppe._count._all,
      }))
      .sort((a, b) => b.anzahl - a.anzahl),
    formen: formGruppen
      .filter((gruppe) => istDarreichungsform(gruppe.darreichungsform))
      .map((gruppe) => ({
        wert: gruppe.darreichungsform as Darreichungsform,
        anzahl: gruppe._count._all,
      }))
      .sort((a, b) => b.anzahl - a.anzahl),
    geschmaecker: ALLE_GESCHMAECKER.map((achse) => ({
      wert: achse,
      anzahl: geschmacksZaehler.get(achse) ?? 0,
    })),
    thcSpanne: {
      min: zuZahl(thcAggregat._min.thcMinProzent) ?? 0,
      max: zuZahl(thcAggregat._max.thcMaxProzent) ?? 100,
    },
    preisSpanneCent: {
      min: preisAggregat._min.preisProGrammCent ?? null,
      max: preisAggregat._max.preisProGrammCent ?? null,
    },
    apotheken,
  };
}

// ---------------------------------------------------------------------------
//  Apotheken
// ---------------------------------------------------------------------------

export type ApothekenListenEintrag = {
  id: string;
  slug: string;
  name: string;
  plz: string;
  ort: string;
  versandapotheke: boolean;
  lieferzeitTageMin: number;
  lieferzeitTageMax: number;
  rezeptStatus: RezeptStatus;
  eRezeptTokenUpload: boolean;
  anzahlProdukte: number;
};

/** Apothekenuebersicht. Eine Abfrage, `take` begrenzt. */
export async function ladeApothekenListe(): Promise<ApothekenListenEintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.pharmacy.findMany({
    orderBy: { name: "asc" },
    take: 200,
    select: {
      id: true,
      slug: true,
      name: true,
      plz: true,
      ort: true,
      versandapotheke: true,
      lieferzeitTageMin: true,
      lieferzeitTageMax: true,
      rezeptStatus: true,
      eRezeptTokenUpload: true,
      _count: { select: { bestaende: true } },
    },
  });

  return zeilen.map((zeile) => ({
    id: zeile.id,
    slug: zeile.slug,
    name: zeile.name,
    plz: zeile.plz,
    ort: zeile.ort,
    versandapotheke: zeile.versandapotheke,
    lieferzeitTageMin: zeile.lieferzeitTageMin,
    lieferzeitTageMax: zeile.lieferzeitTageMax,
    rezeptStatus: alsRezeptStatus(zeile.rezeptStatus),
    eRezeptTokenUpload: zeile.eRezeptTokenUpload,
    anzahlProdukte: zeile._count.bestaende,
  }));
}

export type ApothekeDetail = {
  id: string;
  slug: string;
  name: string;
  plz: string;
  ort: string;
  strasse: string | null;
  telefon: string | null;
  email: string | null;
  website: string | null;
  versandapotheke: boolean;
  lieferzeitTageMin: number;
  lieferzeitTageMax: number;
  rezeptStatus: RezeptStatus;
  eRezeptTokenUpload: boolean;
  betriebserlaubnisNr: string | null;
  /** Nur sichtbare Bestaende - dieselbe Regel wie in der Liste (§ 10 HWG). */
  sortiment: {
    id: string;
    packungGramm: number;
    preisProGrammCent: number | null;
    status: string;
    standAm: Date;
    strain: {
      slug: string;
      handelsname: string;
      kultivarTyp: KultivarTyp;
      darreichungsform: Darreichungsform;
      thcMinProzent: number;
      thcMaxProzent: number;
    };
  }[];
};

/** Eine Apotheke mit sichtbarem Sortiment. `null`, wenn unbekannt. */
export async function ladeApothekeDetail(
  slug: string,
  fachkreis: boolean
): Promise<ApothekeDetail | null> {
  const prisma = await getPrisma();
  const zeile = await prisma.pharmacy.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      plz: true,
      ort: true,
      strasse: true,
      telefon: true,
      email: true,
      website: true,
      versandapotheke: true,
      lieferzeitTageMin: true,
      lieferzeitTageMax: true,
      rezeptStatus: true,
      eRezeptTokenUpload: true,
      betriebserlaubnisNr: true,
      bestaende: {
        where: { ...bestandSichtbarkeit(fachkreis), strain: { aktiv: true } },
        orderBy: [{ status: "asc" }, { preisProGrammCent: "asc" }],
        take: 100,
        select: {
          id: true,
          packungGramm: true,
          preisProGrammCent: true,
          status: true,
          standAm: true,
          strain: {
            select: {
              slug: true,
              handelsname: true,
              kultivarTyp: true,
              darreichungsform: true,
              thcMinProzent: true,
              thcMaxProzent: true,
            },
          },
        },
      },
    },
  });

  if (!zeile) return null;

  return {
    id: zeile.id,
    slug: zeile.slug,
    name: zeile.name,
    plz: zeile.plz,
    ort: zeile.ort,
    strasse: zeile.strasse,
    telefon: zeile.telefon,
    email: zeile.email,
    website: zeile.website,
    versandapotheke: zeile.versandapotheke,
    lieferzeitTageMin: zeile.lieferzeitTageMin,
    lieferzeitTageMax: zeile.lieferzeitTageMax,
    rezeptStatus: alsRezeptStatus(zeile.rezeptStatus),
    eRezeptTokenUpload: zeile.eRezeptTokenUpload,
    betriebserlaubnisNr: zeile.betriebserlaubnisNr,
    sortiment: zeile.bestaende.map((bestand) => ({
      id: bestand.id,
      packungGramm: bestand.packungGramm,
      preisProGrammCent: bestand.preisProGrammCent,
      status: alsBestandStatus(bestand.status),
      standAm: bestand.standAm,
      strain: {
        slug: bestand.strain.slug,
        handelsname: bestand.strain.handelsname,
        kultivarTyp: alsKultivarTyp(bestand.strain.kultivarTyp),
        darreichungsform: alsDarreichungsform(bestand.strain.darreichungsform),
        thcMinProzent: zuZahlPflicht(bestand.strain.thcMinProzent),
        thcMaxProzent: zuZahlPflicht(bestand.strain.thcMaxProzent),
      },
    })),
  };
}

// ---------------------------------------------------------------------------
//  Schlanke Auswahlliste
// ---------------------------------------------------------------------------

/** Obergrenze der Auswahlliste. Ein `select` mit 500 Eintraegen ist die Grenze
 *  des Zumutbaren; darueber braucht die Seite eine Suche statt einer Liste. */
const MAX_AUSWAHL = 500;

export type StrainAuswahlEintrag = {
  id: string;
  handelsname: string;
};

/**
 * Nur Id und Handelsname aller aktiven Produkte - fuer das Auswahlfeld im
 * Vorschlagsformular.
 *
 * Bewusst nicht `ladeStrainListe`: die holt Terpene, Bestaende und Preise
 * mit. Fuer ein `<select>` waere das ein Vielfaches der noetigen Daten.
 */
export async function ladeStrainAuswahl(): Promise<StrainAuswahlEintrag[]> {
  const prisma = await getPrisma();
  return prisma.strain.findMany({
    where: { aktiv: true },
    select: { id: true, handelsname: true },
    orderBy: { handelsname: "asc" },
    take: MAX_AUSWAHL,
  });
}

// ---------------------------------------------------------------------------
//  Aroma-Karte der Startseite (Spec Redesign 16)
// ---------------------------------------------------------------------------

export type AromaVorzeige = {
  handelsname: string;
  slug: string;
  terpene: TerpenEintrag[];
  /** Rohe Spalten der freigegebenen Bewertungen; verdichtet wird in der Sektion. */
  reviews: { geschmacksMatrix: unknown; terpenIntensitaet: unknown }[];
};

/**
 * Die Sorte, an der die Startseite die Aroma-Karte vorführt: aktiv, mit
 * Terpenangaben, mit den meisten Bewertungen. Keine Preise, keine Bestände,
 * also unabhängig vom Fachkreis-Gate.
 */
export async function ladeAromaVorzeige(): Promise<AromaVorzeige | null> {
  const prisma = await getPrisma();
  const zeile = await prisma.strain.findFirst({
    where: { aktiv: true, terpene: { some: {} }, reviews: { some: { freigegeben: true } } },
    orderBy: { reviews: { _count: "desc" } },
    select: {
      handelsname: true,
      slug: true,
      terpene: {
        orderBy: { rang: "asc" },
        select: {
          rang: true,
          konzentrationProzent: true,
          terpen: { select: { name: true, aromaProfil: true, geschmack: true } },
        },
      },
      reviews: {
        where: { freigegeben: true },
        take: 50,
        select: { geschmacksMatrix: true, terpenIntensitaet: true },
      },
    },
  });
  if (!zeile) return null;
  return {
    handelsname: zeile.handelsname,
    slug: zeile.slug,
    terpene: zeile.terpene.map((eintrag) => ({
      name: eintrag.terpen.name,
      aromaProfil: eintrag.terpen.aromaProfil,
      geschmack: alsGeschmacksKategorie(eintrag.terpen.geschmack),
      konzentrationProzent: zuZahl(eintrag.konzentrationProzent),
      rang: eintrag.rang,
    })),
    reviews: zeile.reviews,
  };
}
