/**
 * Seed fuer den Medizinalcannabis-Katalog.
 *
 * Ausfuehren:  npm run db:seed          (lokale D1-Datei unter .wrangler/)
 *              npm run db:seed -- <pfad> (eine andere SQLite-Datei)
 *
 * WARUM NICHT UEBER DEN D1-ADAPTER: `@prisma/adapter-d1` braucht ein
 * D1Database-Binding, und das gibt es nur im laufenden Worker - ein Skript in
 * Node hat keins. Der Seed schreibt deshalb mit einem SQLite-Treiber direkt
 * in dieselbe Datei, die Miniflare fuer die lokale D1 benutzt. Dieselben
 * Tabellen, derselbe Inhalt, nur ohne Umweg ueber den Worker.
 *
 * FUER DIE ENTFERNTE DATENBANK ist dieser Weg nicht nutzbar - dorthin fuehrt
 * kein Dateipfad. Der Weg dorthin ist ein Export der lokal geseedeten Daten:
 *     npx wrangler d1 export cn-medcan-db --local --no-schema --output db/seed-daten.sql
 *     npx wrangler d1 execute cn-medcan-db --remote --file db/seed-daten.sql
 * Siehe db/README.md.
 *
 * Das Skript ist idempotent: alles laeuft ueber `upsert` gegen die
 * Unique-Felder des Schemas und kann beliebig oft laufen.
 *
 * ACHTUNG - alle Produktdaten hier sind FIKTIV. Handelsnamen, Firmen,
 * Apotheken, PZN und Chargennummern sind erfunden und bewusst als solche
 * erkennbar. Keine echten Markennamen, keine realistisch aussehenden PZN.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../lib/generated/prisma/client";

const D1_VERZEICHNIS = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

/**
 * Findet die lokale D1-Datei. Miniflare benennt sie nach einem Hash der
 * Datenbank-ID, der Name ist also nicht vorhersagbar - `metadata.sqlite`
 * gehoert Miniflare selbst und ist es nie.
 */
function findeLokaleD1(): string {
  if (!existsSync(D1_VERZEICHNIS)) {
    throw new Error(
      `Keine lokale D1 gefunden (${D1_VERZEICHNIS} fehlt). Zuerst die Migration anwenden:
` +
        "  npx wrangler d1 migrations apply cn-medcan-db --local"
    );
  }
  const dateien = readdirSync(D1_VERZEICHNIS).filter(
    (name) => name.endsWith(".sqlite") && name !== "metadata.sqlite"
  );
  if (dateien.length !== 1) {
    throw new Error(
      `Erwartet genau eine D1-Datei in ${D1_VERZEICHNIS}, gefunden: ${dateien.length}. ` +
        "Pfad sonst als Argument uebergeben: npm run db:seed -- <pfad>"
    );
  }
  return join(D1_VERZEICHNIS, dateien[0]);
}

const zielDatei = process.argv[2] ?? findeLokaleD1();

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${zielDatei}` }),
});

/** Instagram-Reel-URL ist optional und steht nur in .env.local. */
const reelUrl = process.env.NEXT_PUBLIC_INSTAGRAM_REEL_URL ?? null;

// ---------------------------------------------------------------------------
//  Terpene - je eine Geschmacksachse aus GeschmacksKategorie
// ---------------------------------------------------------------------------

const terpenDaten = [
  {
    name: "Myrcen",
    aromaProfil: "erdig-moschusartig, Hopfen und feuchtes Laub",
    geschmack: "ERDIG",
    siedepunktC: 167,
  },
  {
    name: "Limonen",
    aromaProfil: "frische Zitrusschale, Grapefruit und Zitrone",
    geschmack: "ZITRUS",
    siedepunktC: 176,
  },
  {
    name: "beta-Caryophyllen",
    aromaProfil: "schwarzer Pfeffer, Nelke, warm-scharf",
    geschmack: "WUERZIG",
    siedepunktC: 130,
  },
  {
    name: "Linalool",
    aromaProfil: "Lavendel, blumig mit leicht seifiger Suesse",
    geschmack: "BLUMIG",
    siedepunktC: 198,
  },
  {
    name: "alpha-Pinen",
    aromaProfil: "Kiefernnadel, Harz, frisches Nadelholz",
    geschmack: "HOLZIG",
    siedepunktC: 155,
  },
  {
    name: "Terpinolen",
    aromaProfil: "scharf-loesemittelartig, Treibstoffnote mit Apfel",
    geschmack: "DIESEL",
    siedepunktC: 186,
  },
  {
    name: "Humulen",
    aromaProfil: "bitter-kraeutrig, Hopfenblueten und Beifuss",
    geschmack: "KRAEUTRIG",
    siedepunktC: 198,
  },
  {
    name: "Ocimen",
    aromaProfil: "suesslich-fruchtig, Mango und Basilikumbluete",
    geschmack: "SUESS",
    siedepunktC: 100,
  },
] as const;

// ---------------------------------------------------------------------------
//  Unternehmen - fiktive Hersteller und Importeure
// ---------------------------------------------------------------------------

const unternehmenDaten = [
  {
    name: "Nordlicht Kultivar GmbH (fiktiv)",
    land: "Deutschland",
    rolle: "HERSTELLER",
    gdpNummer: "GDP-FIKTIV-1001",
    website: "https://example.invalid/nordlicht",
  },
  {
    name: "Talwind Pharma Import AG (fiktiv)",
    land: "Deutschland",
    rolle: "IMPORTEUR",
    gdpNummer: "GDP-FIKTIV-1002",
    website: "https://example.invalid/talwind",
  },
  {
    name: "Maple Ridge Botanicals Ltd. (fiktiv)",
    land: "Kanada",
    rolle: "BEIDES",
    gdpNummer: "GDP-FIKTIV-1003",
    website: "https://example.invalid/mapleridge",
  },
  {
    name: "Aurora Valley Cultivation Pty (fiktiv)",
    land: "Australien",
    rolle: "HERSTELLER",
    gdpNummer: "GDP-FIKTIV-1004",
    website: "https://example.invalid/auroravalley",
  },
] as const;

// ---------------------------------------------------------------------------
//  Strains - 8 fiktive Handelsnamen
// ---------------------------------------------------------------------------

type TerpenZuordnung = { terpen: string; rang: number; konzentration: number };

type StrainSeed = {
  slug: string;
  handelsname: string;
  pzn: string;
  darreichungsform: Darreichungsform;
  kultivarName: string;
  kultivarTyp: KultivarTyp;
  genetik: string;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  bestrahlung: Bestrahlung;
  anbauland: string;
  beschreibung: string;
  hersteller: string;
  importeur: string;
  terpene: TerpenZuordnung[];
};

const strainDaten: StrainSeed[] = [
  {
    slug: "nebelharz-22",
    handelsname: "Nebelharz 22 (fiktiv)",
    pzn: "PZN-FIKTIV-0001",
    darreichungsform: "BLUETE",
    kultivarName: "Nebelharz",
    kultivarTyp: "INDICA",
    genetik: "Fiktivkreuzung A x Fiktivkreuzung B",
    thcMin: 21,
    thcMax: 24,
    cbdMin: 0,
    cbdMax: 1,
    bestrahlung: "GAMMA",
    anbauland: "Kanada",
    beschreibung:
      "Dichte, harzreiche Bluete mit erdig-moschusartigem Grundton und deutlicher Pfeffernote im Abgang.",
    hersteller: "Maple Ridge Botanicals Ltd. (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "Myrcen", rang: 1, konzentration: 0.92 },
      { terpen: "beta-Caryophyllen", rang: 2, konzentration: 0.41 },
      { terpen: "Humulen", rang: 3, konzentration: 0.18 },
    ],
  },
  {
    slug: "zitronensegel-18",
    handelsname: "Zitronensegel 18 (fiktiv)",
    pzn: "PZN-FIKTIV-0002",
    darreichungsform: "BLUETE",
    kultivarName: "Zitronensegel",
    kultivarTyp: "SATIVA",
    genetik: "Fiktivkreuzung C x Fiktivkreuzung D",
    thcMin: 17,
    thcMax: 20,
    cbdMin: 0,
    cbdMax: 1,
    bestrahlung: "E_BEAM",
    anbauland: "Portugal",
    beschreibung:
      "Hellgruene, luftige Bluete mit ausgepraegter Zitrusschale und blumigem Nachklang.",
    hersteller: "Nordlicht Kultivar GmbH (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "Limonen", rang: 1, konzentration: 1.05 },
      { terpen: "Linalool", rang: 2, konzentration: 0.33 },
      { terpen: "alpha-Pinen", rang: 3, konzentration: 0.22 },
      { terpen: "Ocimen", rang: 4, konzentration: 0.11 },
    ],
  },
  {
    slug: "treibstoff-nord-27",
    handelsname: "Treibstoff Nord 27 (fiktiv)",
    pzn: "PZN-FIKTIV-0003",
    darreichungsform: "BLUETE",
    kultivarName: "Treibstoff Nord",
    kultivarTyp: "HYBRID",
    genetik: "Fiktivkreuzung E x Fiktivkreuzung F",
    thcMin: 25,
    thcMax: 28,
    cbdMin: 0,
    cbdMax: 1,
    bestrahlung: "UNBESTRAHLT",
    anbauland: "Australien",
    beschreibung:
      "Sehr potente Bluete mit scharfer Treibstoffnote, harzig und langanhaltend im Geruch.",
    hersteller: "Aurora Valley Cultivation Pty (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "Terpinolen", rang: 1, konzentration: 0.87 },
      { terpen: "Myrcen", rang: 2, konzentration: 0.54 },
      { terpen: "Limonen", rang: 3, konzentration: 0.29 },
    ],
  },
  {
    slug: "lavendelgrund-9",
    handelsname: "Lavendelgrund 9 (fiktiv)",
    pzn: "PZN-FIKTIV-0004",
    darreichungsform: "BLUETE",
    kultivarName: "Lavendelgrund",
    kultivarTyp: "INDICA",
    genetik: "Fiktivkreuzung G x Fiktivkreuzung H",
    thcMin: 7.5,
    thcMax: 9.5,
    cbdMin: 0,
    cbdMax: 1,
    bestrahlung: "GAMMA",
    anbauland: "Deutschland",
    beschreibung:
      "Niedrig dosierte Bluete fuer den Einstieg, blumig-lavendelartig mit weicher Konsistenz.",
    hersteller: "Nordlicht Kultivar GmbH (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "Linalool", rang: 1, konzentration: 0.64 },
      { terpen: "Myrcen", rang: 2, konzentration: 0.38 },
    ],
  },
  {
    slug: "stillwasser-cbd-12",
    handelsname: "Stillwasser CBD 12 (fiktiv)",
    pzn: "PZN-FIKTIV-0005",
    darreichungsform: "BLUETE",
    kultivarName: "Stillwasser",
    kultivarTyp: "HYBRID",
    genetik: "Fiktivkreuzung I x Fiktivkreuzung J",
    thcMin: 0.4,
    thcMax: 1,
    cbdMin: 10,
    cbdMax: 13,
    bestrahlung: "E_BEAM",
    anbauland: "Daenemark",
    beschreibung:
      "CBD-dominante Bluete mit sehr niedrigem THC-Gehalt, kraeutrig-bitterer Grundton.",
    hersteller: "Nordlicht Kultivar GmbH (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "Humulen", rang: 1, konzentration: 0.51 },
      { terpen: "beta-Caryophyllen", rang: 2, konzentration: 0.34 },
      { terpen: "Myrcen", rang: 3, konzentration: 0.2 },
    ],
  },
  {
    slug: "kiefernkante-cbd-8",
    handelsname: "Kiefernkante CBD 8 (fiktiv)",
    pzn: "PZN-FIKTIV-0006",
    darreichungsform: "GRANULAT",
    kultivarName: "Kiefernkante",
    kultivarTyp: "RUDERALIS",
    genetik: "Fiktivkreuzung K x Fiktiv-Ruderalis",
    thcMin: 0.3,
    thcMax: 0.8,
    cbdMin: 7,
    cbdMax: 9,
    bestrahlung: "GAMMA",
    anbauland: "Deutschland",
    beschreibung:
      "CBD-dominantes Granulat, harzig-holzige Kiefernnote, fuer die Verdampfung vordosiert.",
    hersteller: "Nordlicht Kultivar GmbH (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "alpha-Pinen", rang: 1, konzentration: 0.72 },
      { terpen: "Humulen", rang: 2, konzentration: 0.26 },
      { terpen: "Ocimen", rang: 3, konzentration: 0.14 },
    ],
  },
  {
    slug: "honigwind-20",
    handelsname: "Honigwind 20 (fiktiv)",
    pzn: "PZN-FIKTIV-0007",
    darreichungsform: "BLUETE",
    kultivarName: "Honigwind",
    kultivarTyp: "SATIVA",
    genetik: "Fiktivkreuzung L x Fiktivkreuzung M",
    thcMin: 19,
    thcMax: 22,
    cbdMin: 0,
    cbdMax: 1,
    bestrahlung: "UNBESTRAHLT",
    anbauland: "Kanada",
    beschreibung:
      "Suesslich-fruchtige Bluete mit Mangonote, locker gewachsen und sehr aromatisch.",
    hersteller: "Maple Ridge Botanicals Ltd. (fiktiv)",
    importeur: "Maple Ridge Botanicals Ltd. (fiktiv)",
    terpene: [
      { terpen: "Ocimen", rang: 1, konzentration: 0.81 },
      { terpen: "Limonen", rang: 2, konzentration: 0.45 },
      { terpen: "Myrcen", rang: 3, konzentration: 0.31 },
      { terpen: "Linalool", rang: 4, konzentration: 0.12 },
    ],
  },
  {
    slug: "pfefferstern-extrakt",
    handelsname: "Pfefferstern Extrakt (fiktiv)",
    pzn: "PZN-FIKTIV-0008",
    darreichungsform: "EXTRAKT",
    kultivarName: "Pfefferstern",
    kultivarTyp: "HYBRID",
    genetik: "Vollspektrum-Extrakt aus Fiktivkreuzung N",
    thcMin: 24,
    thcMax: 26,
    cbdMin: 1,
    cbdMax: 2,
    bestrahlung: "UNBEKANNT",
    anbauland: "Niederlande",
    beschreibung:
      "Vollspektrum-Extrakt in oeliger Traegerloesung, deutlich wuerzig mit Nelkennote.",
    hersteller: "Maple Ridge Botanicals Ltd. (fiktiv)",
    importeur: "Talwind Pharma Import AG (fiktiv)",
    terpene: [
      { terpen: "beta-Caryophyllen", rang: 1, konzentration: 1.24 },
      { terpen: "Terpinolen", rang: 2, konzentration: 0.37 },
      { terpen: "alpha-Pinen", rang: 3, konzentration: 0.19 },
    ],
  },
];

// ---------------------------------------------------------------------------
//  Apotheken - fiktive deutsche Versandapotheken
// ---------------------------------------------------------------------------

const apothekenDaten = [
  {
    slug: "apotheke-am-nordkanal-fiktiv",
    name: "Apotheke am Nordkanal (fiktiv)",
    plz: "20095",
    ort: "Hamburg",
    strasse: "Beispielallee 12",
    telefon: "+49 40 000000",
    email: "versand@example.invalid",
    website: "https://example.invalid/nordkanal",
    lieferzeitTageMin: 1,
    lieferzeitTageMax: 2,
    rezeptStatus: "E_REZEPT_ONLY",
    eRezeptTokenUpload: true,
    betriebserlaubnisNr: "BE-FIKTIV-2001",
  },
  {
    slug: "sonnenhof-apotheke-fiktiv",
    name: "Sonnenhof-Apotheke (fiktiv)",
    plz: "80331",
    ort: "Muenchen",
    strasse: "Musterstrasse 4",
    telefon: "+49 89 000000",
    email: "rezept@example.invalid",
    website: "https://example.invalid/sonnenhof",
    lieferzeitTageMin: 2,
    lieferzeitTageMax: 4,
    rezeptStatus: "BEIDES",
    eRezeptTokenUpload: true,
    betriebserlaubnisNr: "BE-FIKTIV-2002",
  },
  {
    slug: "rheinbogen-versandapotheke-fiktiv",
    name: "Rheinbogen Versandapotheke (fiktiv)",
    plz: "50667",
    ort: "Koeln",
    strasse: "Beispielring 88",
    telefon: "+49 221 000000",
    email: "info@example.invalid",
    website: "https://example.invalid/rheinbogen",
    lieferzeitTageMin: 1,
    lieferzeitTageMax: 3,
    rezeptStatus: "E_REZEPT_ONLY",
    eRezeptTokenUpload: true,
    betriebserlaubnisNr: "BE-FIKTIV-2003",
  },
  {
    slug: "elbsand-apotheke-fiktiv",
    name: "Elbsand-Apotheke (fiktiv)",
    plz: "01067",
    ort: "Dresden",
    strasse: "Platzhalterweg 3",
    telefon: "+49 351 000000",
    email: "kontakt@example.invalid",
    website: "https://example.invalid/elbsand",
    lieferzeitTageMin: 3,
    lieferzeitTageMax: 5,
    rezeptStatus: "PAPIER_ONLY",
    eRezeptTokenUpload: false,
    betriebserlaubnisNr: "BE-FIKTIV-2004",
  },
  {
    slug: "taunusquelle-apotheke-fiktiv",
    name: "Taunusquelle-Apotheke (fiktiv)",
    plz: "60311",
    ort: "Frankfurt am Main",
    strasse: "Fiktivgasse 21",
    telefon: "+49 69 000000",
    email: "service@example.invalid",
    website: "https://example.invalid/taunusquelle",
    lieferzeitTageMin: 2,
    lieferzeitTageMax: 3,
    rezeptStatus: "BEIDES",
    eRezeptTokenUpload: true,
    betriebserlaubnisNr: "BE-FIKTIV-2005",
  },
] as const;

// ---------------------------------------------------------------------------
//  Bestaende - 26 Zeilen ueber alle BestandStatus-Werte
// ---------------------------------------------------------------------------

type BestandSeed = {
  apotheke: string;
  strain: string;
  packungGramm: number;
  preisProGrammCent: number;
  bestandGramm: number | null;
  status: BestandStatus;
  nurFuerFachkreise: boolean;
};

const bestandDaten: BestandSeed[] = [
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "nebelharz-22", packungGramm: 10, preisProGrammCent: 1120, bestandGramm: 240, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "nebelharz-22", packungGramm: 30, preisProGrammCent: 980, bestandGramm: 90, status: "VERFUEGBAR", nurFuerFachkreise: true },
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "zitronensegel-18", packungGramm: 10, preisProGrammCent: 1050, bestandGramm: 120, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "treibstoff-nord-27", packungGramm: 5, preisProGrammCent: 1780, bestandGramm: 35, status: "NACHBESTELLT", nurFuerFachkreise: true },
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "honigwind-20", packungGramm: 15, preisProGrammCent: 1240, bestandGramm: 60, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "apotheke-am-nordkanal-fiktiv", strain: "pfefferstern-extrakt", packungGramm: 5, preisProGrammCent: 1690, bestandGramm: null, status: "NICHT_LIEFERBAR", nurFuerFachkreise: true },

  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "nebelharz-22", packungGramm: 15, preisProGrammCent: 1080, bestandGramm: 150, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "lavendelgrund-9", packungGramm: 10, preisProGrammCent: 720, bestandGramm: 200, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "stillwasser-cbd-12", packungGramm: 10, preisProGrammCent: 640, bestandGramm: 310, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "kiefernkante-cbd-8", packungGramm: 30, preisProGrammCent: 610, bestandGramm: 120, status: "NACHBESTELLT", nurFuerFachkreise: true },
  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "treibstoff-nord-27", packungGramm: 10, preisProGrammCent: 1650, bestandGramm: 45, status: "VERFUEGBAR", nurFuerFachkreise: true },
  { apotheke: "sonnenhof-apotheke-fiktiv", strain: "zitronensegel-18", packungGramm: 5, preisProGrammCent: 1130, bestandGramm: 25, status: "AUSGELISTET", nurFuerFachkreise: true },

  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "zitronensegel-18", packungGramm: 15, preisProGrammCent: 1010, bestandGramm: 180, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "honigwind-20", packungGramm: 10, preisProGrammCent: 1280, bestandGramm: 95, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "lavendelgrund-9", packungGramm: 30, preisProGrammCent: 680, bestandGramm: 240, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "pfefferstern-extrakt", packungGramm: 10, preisProGrammCent: 1600, bestandGramm: 40, status: "NACHBESTELLT", nurFuerFachkreise: true },
  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "stillwasser-cbd-12", packungGramm: 15, preisProGrammCent: 630, bestandGramm: 140, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "rheinbogen-versandapotheke-fiktiv", strain: "nebelharz-22", packungGramm: 5, preisProGrammCent: 1190, bestandGramm: null, status: "NICHT_LIEFERBAR", nurFuerFachkreise: true },

  { apotheke: "elbsand-apotheke-fiktiv", strain: "kiefernkante-cbd-8", packungGramm: 10, preisProGrammCent: 660, bestandGramm: 85, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "elbsand-apotheke-fiktiv", strain: "lavendelgrund-9", packungGramm: 15, preisProGrammCent: 700, bestandGramm: 110, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "elbsand-apotheke-fiktiv", strain: "treibstoff-nord-27", packungGramm: 30, preisProGrammCent: 1540, bestandGramm: 30, status: "AUSGELISTET", nurFuerFachkreise: true },
  { apotheke: "elbsand-apotheke-fiktiv", strain: "honigwind-20", packungGramm: 5, preisProGrammCent: 1330, bestandGramm: 20, status: "NACHBESTELLT", nurFuerFachkreise: true },

  { apotheke: "taunusquelle-apotheke-fiktiv", strain: "pfefferstern-extrakt", packungGramm: 15, preisProGrammCent: 1580, bestandGramm: 55, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "taunusquelle-apotheke-fiktiv", strain: "stillwasser-cbd-12", packungGramm: 30, preisProGrammCent: 600, bestandGramm: 260, status: "VERFUEGBAR", nurFuerFachkreise: false },
  { apotheke: "taunusquelle-apotheke-fiktiv", strain: "nebelharz-22", packungGramm: 15, preisProGrammCent: 1100, bestandGramm: 70, status: "NICHT_LIEFERBAR", nurFuerFachkreise: true },
  { apotheke: "taunusquelle-apotheke-fiktiv", strain: "kiefernkante-cbd-8", packungGramm: 5, preisProGrammCent: 780, bestandGramm: 15, status: "AUSGELISTET", nurFuerFachkreise: true },
];

// ---------------------------------------------------------------------------
//  Chargen
// ---------------------------------------------------------------------------

const chargenDaten = [
  { strain: "nebelharz-22", chargenNr: "CH-FIKTIV-2401", analysedatum: "2026-01-15", thcIst: 22.4, cbdIst: 0.4, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2401.pdf", verfallsdatum: "2028-01-31" },
  { strain: "zitronensegel-18", chargenNr: "CH-FIKTIV-2402", analysedatum: "2026-02-03", thcIst: 18.7, cbdIst: 0.3, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2402.pdf", verfallsdatum: "2028-02-28" },
  { strain: "treibstoff-nord-27", chargenNr: "CH-FIKTIV-2403", analysedatum: "2026-02-20", thcIst: 26.9, cbdIst: 0.2, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2403.pdf", verfallsdatum: "2028-03-31" },
  { strain: "lavendelgrund-9", chargenNr: "CH-FIKTIV-2404", analysedatum: "2026-03-08", thcIst: 8.6, cbdIst: 0.5, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2404.pdf", verfallsdatum: "2028-04-30" },
  { strain: "stillwasser-cbd-12", chargenNr: "CH-FIKTIV-2405", analysedatum: "2026-03-25", thcIst: 0.7, cbdIst: 11.8, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2405.pdf", verfallsdatum: "2028-05-31" },
  { strain: "honigwind-20", chargenNr: "CH-FIKTIV-2406", analysedatum: "2026-04-11", thcIst: 20.5, cbdIst: 0.3, laborBericht: "https://example.invalid/coa/CH-FIKTIV-2406.pdf", verfallsdatum: "2028-06-30" },
] as const;

// ---------------------------------------------------------------------------
//  Bewertungen
// ---------------------------------------------------------------------------

/**
 * ACHTUNG: Diese Autor-UUIDs sind feste Platzhalter und zeigen auf KEINEN
 * existierenden Nutzer. Fachlich referenziert `reviews.autor_id` die Tabelle
 * `auth.users` in Supabase (im Prisma-Schema bewusst ohne Relation, weil
 * `auth` ein fremdes Schema ist). Sobald echte Supabase-Auth-Nutzer angelegt
 * sind, muessen diese IDs durch deren echte UUIDs ersetzt werden - sonst
 * greifen die RLS-Policies auf `reviews` (autor_id = auth.uid()) fuer
 * niemanden, und die Seed-Bewertungen haben keinen Besitzer.
 */
const AUTOR_FIKTIV_1 = "00000000-0000-4000-8000-000000000001";
const AUTOR_FIKTIV_2 = "00000000-0000-4000-8000-000000000002";
const AUTOR_FIKTIV_3 = "00000000-0000-4000-8000-000000000003";

/** Alle acht Achsen der Geschmacks-Matrix, Intensitaet jeweils 0-5. */
type GeschmacksMatrix = {
  diesel: number;
  zitrus: number;
  erdig: number;
  suess: number;
  wuerzig: number;
  blumig: number;
  holzig: number;
  kraeutrig: number;
};

type ReviewSeed = {
  strain: string;
  chargenNr: string;
  autorId: string;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  feuchtigkeitProzent: number;
  geschmacksMatrix: GeschmacksMatrix;
  notiz: string;
  instagramReelUrl: string | null;
  freigegeben: boolean;
};

const reviewDaten: ReviewSeed[] = [
  {
    strain: "nebelharz-22",
    chargenNr: "CH-FIKTIV-2401",
    autorId: AUTOR_FIKTIV_1,
    aussehen: 5,
    geruch: 5,
    geschmack: 4,
    wirkung: 5,
    konsistenz: 4,
    feuchtigkeitProzent: 11.2,
    geschmacksMatrix: { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2 },
    notiz: "Sehr dichte Blueten, erdig mit klarer Pfeffernote. Gut manuell zerkleinerbar.",
    instagramReelUrl: reelUrl,
    freigegeben: true,
  },
  {
    strain: "zitronensegel-18",
    chargenNr: "CH-FIKTIV-2402",
    autorId: AUTOR_FIKTIV_2,
    aussehen: 4,
    geruch: 5,
    geschmack: 5,
    wirkung: 3,
    konsistenz: 3,
    feuchtigkeitProzent: 9.4,
    geschmacksMatrix: { diesel: 0, zitrus: 5, erdig: 1, suess: 2, wuerzig: 1, blumig: 3, holzig: 1, kraeutrig: 1 },
    notiz: "Deutliche Zitrusschale beim Oeffnen des Behaelters, eher trockene Konsistenz.",
    instagramReelUrl: reelUrl,
    freigegeben: true,
  },
  {
    strain: "treibstoff-nord-27",
    chargenNr: "CH-FIKTIV-2403",
    autorId: AUTOR_FIKTIV_1,
    aussehen: 5,
    geruch: 4,
    geschmack: 3,
    wirkung: 5,
    konsistenz: 5,
    feuchtigkeitProzent: 12.6,
    geschmacksMatrix: { diesel: 5, zitrus: 2, erdig: 3, suess: 1, wuerzig: 2, blumig: 0, holzig: 1, kraeutrig: 1 },
    notiz: "Scharfe Treibstoffnote, sehr klebrig. Fuer Einsteiger deutlich zu stark.",
    instagramReelUrl: null,
    freigegeben: true,
  },
  {
    strain: "stillwasser-cbd-12",
    chargenNr: "CH-FIKTIV-2405",
    autorId: AUTOR_FIKTIV_3,
    aussehen: 3,
    geruch: 3,
    geschmack: 3,
    wirkung: 2,
    konsistenz: 4,
    feuchtigkeitProzent: 10.1,
    geschmacksMatrix: { diesel: 0, zitrus: 1, erdig: 3, suess: 1, wuerzig: 2, blumig: 1, holzig: 2, kraeutrig: 5 },
    notiz: "Kraeutrig-bitter, kaum psychoaktive Wirkung - wie bei dem CBD-Verhaeltnis erwartbar.",
    instagramReelUrl: null,
    freigegeben: true,
  },
  {
    strain: "lavendelgrund-9",
    chargenNr: "CH-FIKTIV-2404",
    autorId: AUTOR_FIKTIV_2,
    aussehen: 4,
    geruch: 4,
    geschmack: 4,
    wirkung: 2,
    konsistenz: 3,
    feuchtigkeitProzent: 8.3,
    geschmacksMatrix: { diesel: 0, zitrus: 1, erdig: 2, suess: 2, wuerzig: 1, blumig: 5, holzig: 1, kraeutrig: 2 },
    notiz: "Blumig, angenehm mild. Noch in Moderation - wartet auf Freigabe.",
    instagramReelUrl: null,
    freigegeben: false,
  },
  {
    strain: "honigwind-20",
    chargenNr: "CH-FIKTIV-2406",
    autorId: AUTOR_FIKTIV_3,
    aussehen: 4,
    geruch: 5,
    geschmack: 5,
    wirkung: 4,
    konsistenz: 3,
    feuchtigkeitProzent: 9.8,
    geschmacksMatrix: { diesel: 0, zitrus: 3, erdig: 1, suess: 5, wuerzig: 1, blumig: 2, holzig: 1, kraeutrig: 1 },
    notiz: "Sehr fruchtig, klare Mangonote. Noch in Moderation - wartet auf Freigabe.",
    instagramReelUrl: null,
    freigegeben: false,
  },
];

// ---------------------------------------------------------------------------
//  Ausfuehrung
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seed startet (alle Daten sind fiktiv).\n");

  // 1. Terpene
  const terpenIds = new Map<string, string>();
  for (const t of terpenDaten) {
    const datensatz = await prisma.terpen.upsert({
      where: { name: t.name },
      update: {
        aromaProfil: t.aromaProfil,
        geschmack: t.geschmack,
        siedepunktC: t.siedepunktC,
      },
      create: {
        name: t.name,
        aromaProfil: t.aromaProfil,
        geschmack: t.geschmack,
        siedepunktC: t.siedepunktC,
      },
    });
    terpenIds.set(t.name, datensatz.id);
  }
  console.log(`  Terpene:        ${terpenIds.size}`);

  // 2. Unternehmen - Unique ist [name, rolle]
  const unternehmenIds = new Map<string, string>();
  for (const u of unternehmenDaten) {
    const datensatz = await prisma.unternehmen.upsert({
      where: { name_rolle: { name: u.name, rolle: u.rolle } },
      update: { land: u.land, gdpNummer: u.gdpNummer, website: u.website },
      create: {
        name: u.name,
        land: u.land,
        rolle: u.rolle,
        gdpNummer: u.gdpNummer,
        website: u.website,
      },
    });
    unternehmenIds.set(u.name, datensatz.id);
  }
  console.log(`  Unternehmen:    ${unternehmenIds.size}`);

  // 3. Strains inklusive Terpenprofil
  const strainIds = new Map<string, string>();
  let strainTerpenAnzahl = 0;
  for (const s of strainDaten) {
    const gemeinsam = {
      handelsname: s.handelsname,
      pzn: s.pzn,
      darreichungsform: s.darreichungsform,
      kultivarName: s.kultivarName,
      kultivarTyp: s.kultivarTyp,
      genetik: s.genetik,
      thcMinProzent: s.thcMin,
      thcMaxProzent: s.thcMax,
      cbdMinProzent: s.cbdMin,
      cbdMaxProzent: s.cbdMax,
      bestrahlung: s.bestrahlung,
      anbauland: s.anbauland,
      // Die SVG-Dateien existieren absichtlich nicht - die UI faellt auf einen
      // Platzhalter zurueck, bis echte Herstellerbilder vorliegen.
      herstellerBildPfad: `/produkte/${s.slug}.svg`,
      beschreibung: s.beschreibung,
      verschreibungspflichtig: true,
      bfarmGelistet: true,
      aktiv: true,
      // Kleingeschriebene Suchspalte - siehe Schema. Sie wird hier gefuellt,
      // nicht in der Abfrage berechnet: SQLite kann `contains` nicht
      // case-insensitive.
      suchtext: [s.handelsname, s.kultivarName, s.genetik]
        .filter((teil): teil is string => Boolean(teil))
        .join(" ")
        .toLowerCase(),
      herstellerId: unternehmenIds.get(s.hersteller) ?? null,
      importeurId: unternehmenIds.get(s.importeur) ?? null,
    };

    const datensatz = await prisma.strain.upsert({
      where: { slug: s.slug },
      update: gemeinsam,
      create: { slug: s.slug, ...gemeinsam },
    });
    strainIds.set(s.slug, datensatz.id);

    for (const z of s.terpene) {
      const terpenId = terpenIds.get(z.terpen);
      if (!terpenId) throw new Error(`Terpen fehlt im Seed: ${z.terpen}`);
      await prisma.strainTerpen.upsert({
        where: { strainId_terpenId: { strainId: datensatz.id, terpenId } },
        update: { konzentrationProzent: z.konzentration, rang: z.rang },
        create: {
          strainId: datensatz.id,
          terpenId,
          konzentrationProzent: z.konzentration,
          rang: z.rang,
        },
      });
      strainTerpenAnzahl += 1;
    }
  }
  console.log(`  Strains:        ${strainIds.size}`);
  console.log(`  Terpenprofile:  ${strainTerpenAnzahl}`);

  // 4. Apotheken
  const apothekenIds = new Map<string, string>();
  for (const a of apothekenDaten) {
    const { slug, ...rest } = a;
    const datensatz = await prisma.pharmacy.upsert({
      where: { slug },
      update: rest,
      create: { slug, ...rest },
    });
    apothekenIds.set(slug, datensatz.id);
  }
  console.log(`  Apotheken:      ${apothekenIds.size}`);

  // 5. Bestaende - Unique ist [pharmacyId, strainId, packungGramm]
  let bestandAnzahl = 0;
  for (const b of bestandDaten) {
    const pharmacyId = apothekenIds.get(b.apotheke);
    const strainId = strainIds.get(b.strain);
    if (!pharmacyId || !strainId) {
      throw new Error(`Bestand verweist auf Unbekanntes: ${b.apotheke} / ${b.strain}`);
    }
    await prisma.pharmacyStock.upsert({
      where: {
        pharmacyId_strainId_packungGramm: {
          pharmacyId,
          strainId,
          packungGramm: b.packungGramm,
        },
      },
      update: {
        preisProGrammCent: b.preisProGrammCent,
        bestandGramm: b.bestandGramm,
        status: b.status,
        nurFuerFachkreise: b.nurFuerFachkreise,
      },
      create: {
        pharmacyId,
        strainId,
        packungGramm: b.packungGramm,
        preisProGrammCent: b.preisProGrammCent,
        bestandGramm: b.bestandGramm,
        status: b.status,
        nurFuerFachkreise: b.nurFuerFachkreise,
      },
    });
    bestandAnzahl += 1;
  }
  console.log(`  Bestaende:      ${bestandAnzahl}`);

  // 6. Chargen - Unique ist [strainId, chargenNr]
  const chargenIds = new Map<string, string>();
  for (const c of chargenDaten) {
    const strainId = strainIds.get(c.strain);
    if (!strainId) throw new Error(`Charge verweist auf unbekannten Strain: ${c.strain}`);
    const werte = {
      analysedatum: new Date(c.analysedatum),
      thcIst: c.thcIst,
      cbdIst: c.cbdIst,
      laborBericht: c.laborBericht,
      verfallsdatum: new Date(c.verfallsdatum),
    };
    const datensatz = await prisma.charge.upsert({
      where: { strainId_chargenNr: { strainId, chargenNr: c.chargenNr } },
      update: werte,
      create: { strainId, chargenNr: c.chargenNr, ...werte },
    });
    chargenIds.set(c.chargenNr, datensatz.id);
  }
  console.log(`  Chargen:        ${chargenIds.size}`);

  // 7. Bewertungen. Reviews haben keinen natuerlichen Unique-Key, deshalb
  //    laeuft die Idempotenz ueber Suchen-und-Aktualisieren je (Charge, Autor).
  let reviewAnzahl = 0;
  let reviewFreigegeben = 0;
  for (const r of reviewDaten) {
    const strainId = strainIds.get(r.strain);
    const chargeId = chargenIds.get(r.chargenNr);
    if (!strainId || !chargeId) {
      throw new Error(`Bewertung verweist auf Unbekanntes: ${r.strain} / ${r.chargenNr}`);
    }
    const werte = {
      strainId,
      chargeId,
      autorId: r.autorId,
      aussehen: r.aussehen,
      geruch: r.geruch,
      geschmack: r.geschmack,
      wirkung: r.wirkung,
      konsistenz: r.konsistenz,
      feuchtigkeitProzent: r.feuchtigkeitProzent,
      // SQLite hat keinen Json-Typ: die Matrix geht als JSON-Text in die
      // Spalte. Gelesen wird sie ueber parseGeschmacksMatrix().
      geschmacksMatrix: JSON.stringify(r.geschmacksMatrix),
      notiz: r.notiz,
      instagramReelUrl: r.instagramReelUrl,
      freigegeben: r.freigegeben,
    };
    const vorhanden = await prisma.review.findFirst({
      where: { chargeId, autorId: r.autorId },
      select: { id: true },
    });
    if (vorhanden) {
      await prisma.review.update({ where: { id: vorhanden.id }, data: werte });
    } else {
      await prisma.review.create({ data: werte });
    }
    reviewAnzahl += 1;
    if (r.freigegeben) reviewFreigegeben += 1;
  }
  console.log(`  Bewertungen:    ${reviewAnzahl} (davon freigegeben: ${reviewFreigegeben})`);

  console.log("\nSeed abgeschlossen.");
  console.log(`Geschrieben nach: ${zielDatei}`);
  console.log(
    "Hinweis: db/constraints.sql muss nach jeder Migration erneut ausgefuehrt werden."
  );
}

main()
  .catch((fehler) => {
    console.error("Seed fehlgeschlagen:", fehler);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
