/**
 * Die geschlossenen Wertelisten des Datenmodells.
 *
 * SQLite kennt keine Enums, und Prisma erzeugt fuer D1 deshalb auch keine.
 * Die Wahrheit steht hier; in der Datenbank sind es String-Spalten, die von
 * den CHECK-Constraints in db/constraints.sql auf genau diese Werte
 * festgenagelt werden. Wer hier einen Wert ergaenzt, ergaenzt ihn dort mit -
 * sonst laesst die Datenbank ihn nicht zu.
 *
 * Reihenfolge der Arrays ist die Anzeigereihenfolge in Filtern und Facetten.
 */

export const KULTIVAR_TYPEN = ["INDICA", "SATIVA", "HYBRID", "RUDERALIS"] as const;
export type KultivarTyp = (typeof KULTIVAR_TYPEN)[number];

export const DARREICHUNGSFORMEN = ["BLUETE", "EXTRAKT", "GRANULAT"] as const;
export type Darreichungsform = (typeof DARREICHUNGSFORMEN)[number];

export const BESTRAHLUNGEN = ["GAMMA", "E_BEAM", "UNBESTRAHLT", "UNBEKANNT"] as const;
export type Bestrahlung = (typeof BESTRAHLUNGEN)[number];

export const UNTERNEHMENS_ROLLEN = ["HERSTELLER", "IMPORTEUR", "BEIDES"] as const;
export type UnternehmensRolle = (typeof UNTERNEHMENS_ROLLEN)[number];

/** Wie die Apotheke Rezepte annimmt. E-Rezept ist seit 2024 der Regelfall. */
export const REZEPT_STATUS = ["E_REZEPT_ONLY", "PAPIER_ONLY", "BEIDES"] as const;
export type RezeptStatus = (typeof REZEPT_STATUS)[number];

export const BESTAND_STATUS = [
  "VERFUEGBAR",
  "NACHBESTELLT",
  "NICHT_LIEFERBAR",
  "AUSGELISTET",
] as const;
export type BestandStatus = (typeof BESTAND_STATUS)[number];

/**
 * Geschmacksachsen der Bewertungsmatrix. Bewusst geschlossene Liste, damit
 * Filter, Terpen-Map und Bewertungsmatrix dieselben Kategorien teilen.
 */
export const GESCHMACKS_KATEGORIEN = [
  "DIESEL",
  "ZITRUS",
  "ERDIG",
  "SUESS",
  "WUERZIG",
  "BLUMIG",
  "HOLZIG",
  "KRAEUTRIG",
  "FRUCHTIG",
  "MINZIG",
] as const;
export type GeschmacksKategorie = (typeof GESCHMACKS_KATEGORIEN)[number];

/**
 * Rollen eines Mitglieds. MITGLIED ist der Regelfall; FACHKREIS bleibt fuer
 * die strengere Preis-Sichtbarkeit nach §10 HWG reserviert, ADMIN darf
 * freigeben und Umfragen steuern.
 */
export const MITGLIED_ROLLEN = ["MITGLIED", "FACHKREIS", "ADMIN"] as const;
export type MitgliedRolle = (typeof MITGLIED_ROLLEN)[number];

/**
 * Phasen einer Umfragerunde.
 *
 * VORSCHLAG   - Mitglieder schlagen Strains mit Begruendung vor.
 * ABSTIMMUNG  - der Betreiber hat Vorschlaege als Kandidaten uebernommen,
 *               jedes freigegebene Mitglied hat genau eine Stimme.
 * BEENDET     - Gewinner stehen fest und werden mit den Reviews verknuepft.
 *
 * VORSCHLAG und ABSTIMMUNG gelten als aktiv; genau eine Umfrage darf zur
 * selben Zeit aktiv sein (siehe `umfragen.aktiv` in prisma/schema.prisma).
 */
export const UMFRAGE_PHASEN = ["VORSCHLAG", "ABSTIMMUNG", "BEENDET"] as const;
export type UmfragePhase = (typeof UMFRAGE_PHASEN)[number];

/** Die Phasen, in denen eine Umfrage laeuft. Gegenstueck zu BEENDET. */
export const UMFRAGE_PHASEN_AKTIV: readonly UmfragePhase[] = ["VORSCHLAG", "ABSTIMMUNG"];

/**
 * Woher ein Kandidat kommt.
 *
 * GESETZT   - Wahl des Betreibers. Steht von Anfang an fest, ist NICHT
 *             abstimmbar und traegt in der Oberflaeche keinen Stimmenzaehler.
 * COMMUNITY - aus einem uebernommenen Vorschlag. Darueber wird abgestimmt.
 *
 * Beides muss sichtbar unterschieden bleiben, sonst wirkt die Abstimmung
 * manipuliert.
 */
export const OPTION_HERKUNFT = ["GESETZT", "COMMUNITY"] as const;
export type OptionHerkunft = (typeof OPTION_HERKUNFT)[number];

/**
 * Baut einen Type-Guard ueber einer Werteliste.
 *
 * Gebraucht wird er ueberall dort, wo ein Wert aus der Datenbank kommt: fuer
 * Prisma ist die Spalte nur `string`, und ein Datensatz, der an den
 * CHECK-Constraints vorbei eingespielt wurde (Seed-SQL, manuelles
 * `wrangler d1 execute`), traegt sonst ungeprueft bis in die Oberflaeche.
 */
function istWert<T extends string>(werte: readonly T[]) {
  const erlaubt: ReadonlySet<string> = new Set(werte);
  return (wert: unknown): wert is T => typeof wert === "string" && erlaubt.has(wert);
}

export const istKultivarTyp = istWert(KULTIVAR_TYPEN);
export const istDarreichungsform = istWert(DARREICHUNGSFORMEN);
export const istBestrahlung = istWert(BESTRAHLUNGEN);
export const istUnternehmensRolle = istWert(UNTERNEHMENS_ROLLEN);
export const istRezeptStatus = istWert(REZEPT_STATUS);
export const istBestandStatus = istWert(BESTAND_STATUS);
export const istGeschmacksKategorie = istWert(GESCHMACKS_KATEGORIEN);
export const istMitgliedRolle = istWert(MITGLIED_ROLLEN);
export const istUmfragePhase = istWert(UMFRAGE_PHASEN);
export const istOptionHerkunft = istWert(OPTION_HERKUNFT);

/**
 * Stand eines Bluetenvorschlags (Spec Bluete vorschlagen 3.1). OFFEN wartet auf
 * den Betreiber; FREIGEGEBEN traegt die strainId der Bluete im Katalog.
 */
export const VORSCHLAG_STATUS = ["OFFEN", "FREIGEGEBEN", "ABGELEHNT"] as const;
export type VorschlagStatus = (typeof VORSCHLAG_STATUS)[number];
export const istVorschlagStatus = istWert(VORSCHLAG_STATUS);

/** Arten von Benachrichtigungen im Mitgliederbereich. Erweiterbar (Umfragen, Mail). */
export const BENACHRICHTIGUNG_ARTEN = ["VORSCHLAG_FREIGEGEBEN", "VORSCHLAG_ABGELEHNT"] as const;
export type BenachrichtigungArt = (typeof BENACHRICHTIGUNG_ARTEN)[number];
