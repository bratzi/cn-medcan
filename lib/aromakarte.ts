/**
 * Geometrie und Daten der Aroma-Karte (Spec Redesign 14): links die zehn
 * Geschmacksachsen, rechts die Terpene, dazwischen Bögen wie auf einem
 * Terpen-Poster; per Schalter morphen die Knoten ins Netzdiagramm. Reine
 * Funktionen, damit Darstellung und Verdichtung testbar bleiben.
 */
import { GESCHMACKS_ACHSEN, leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";
import { aromaAnteile } from "@/lib/terpen-aromen";

export type Punkt = { x: number; y: number };
export type KartenTerpen = { name: string; geschmack: GeschmacksKategorie; konzentrationProzent: number | null; rang: number };

export const BREITE = 640;
export const HOEHE = 480;
export const MAX = 5;
// Seit 2026-09-25 (Nutzer: Linien laenger, nicht groesser): die Achsenspalte bleibt
// fest bei 260 (Platz fuer Beschriftung und Balken), die Terpenspalte haengt 220 vor
// dem rechten Rand (Platz fuer die Namen). Bei breiter Karte wachsen nur die Boegen.
const LINKS = 260;
/**
 * Balken beginnen am linken Rand (Nutzer 2026-09-26: Karte über die volle Breite
 * wie die Balken von Overall und Qualität); die Achsennamen stehen im Balken. 14 Rand, damit Skala und Griffe bei 5 nicht abgeschnitten werden.
 */
const BESCHRIFTUNG = 14;

/**
 * Die Geschmacksachse wandert mit der halben Mehrbreite nach rechts (Nutzer
 * 2026-09-25: Skala links und Terpenlinien rechts auf breiten Schirmen etwa
 * 50:50); bei BREITE bleibt sie bei 260, damit schmale Karten Platz für die
 * Bögen behalten. Die Balken füllen den Raum zwischen Beschriftung und Achse.
 */
export function achsenX(breite: number = BREITE): number {
  return runde(LINKS + Math.max(0, breite - BREITE) * 0.5);
}

export function balkenLaenge(breite: number = BREITE): number {
  return runde(achsenX(breite) - 16 - BESCHRIFTUNG);
}
/** Platz rechts der Terpenknoten für die Namen (HTML, feste Größe). */
const RECHTS_ABSTAND = 150;
const OBEN = 48;
const UNTEN = HOEHE - 48;
export const RADIUS = 180;

const runde = (zahl: number) => Math.round(zahl * 10) / 10 + 0;

/**
 * Mittelpunkt des Netzes für eine gegebene Kartenbreite: bleibt in der Mitte
 * der (ggf. breiteren) Karte; die Höhe und damit RADIUS ändern sich nicht,
 * das Netz bleibt also immer gleich groß, nur zentriert auf breite/2.
 */
export function mitteVon(breite: number = BREITE): Punkt {
  return { x: breite / 2, y: HOEHE / 2 };
}

export const MITTE: Punkt = mitteVon();

/** Gleichmäßig verteilte y-Positionen einer Spalte. */
function spalte(anzahl: number, index: number): number {
  if (anzahl <= 1) return HOEHE / 2;
  return runde(OBEN + ((UNTEN - OBEN) / (anzahl - 1)) * index);
}

/** Knoten der Geschmacksachsen in der Karten-Ansicht (linke Spalte). */
export function achsenImKarte(breite: number = BREITE): Punkt[] {
  const x = achsenX(breite);
  return GESCHMACKS_ACHSEN.map((_, index) => ({ x, y: spalte(GESCHMACKS_ACHSEN.length, index) }));
}

/** Knoten der Terpene (rechte Spalte). */
export function terpeneImKarte(anzahl: number, breite: number = BREITE): Punkt[] {
  const x = runde(breite - RECHTS_ABSTAND);
  return Array.from({ length: anzahl }, (_, index) => ({ x, y: spalte(anzahl, index) }));
}

/**
 * Punkt einer Achse im Netz: erste Achse oben, dann im Uhrzeigersinn; Wert 0
 * bis MAX. `mitte` folgt der Kartenbreite (siehe `mitteVon`), damit das Netz
 * bei jeder Breite zentriert bleibt.
 */
export function netzPunkt(index: number, wert: number, radius = RADIUS, mitte: Punkt = MITTE): Punkt {
  const anteil = Math.min(Math.max(wert / MAX, 0), 1);
  const winkel = ((-90 + (360 / GESCHMACKS_ACHSEN.length) * index) * Math.PI) / 180;
  return { x: runde(mitte.x + Math.cos(winkel) * radius * anteil), y: runde(mitte.y + Math.sin(winkel) * radius * anteil) };
}

/**
 * Farbe der Bögen je Geschmacksachse (Nutzer 2026-09-25): Anteil Violett in
 * Prozent für color-mix zwischen Kopierstift (violett) und Akzent (grün).
 * Liegt die lila Serie (eigener Eindruck bzw. Community) über dem Hersteller,
 * wird es violetter; übertreibt der Hersteller, grüner. Stärke |Differenz| / MAX,
 * um die Hälfte verstärkt und gedeckelt. Ohne Werte oder bei Gleichstand null
 * (dann bleibt die gewohnte Farbe).
 */
export function abweichungsAnteil(lila: number | undefined, hersteller: number | undefined): number | null {
  if (lila === undefined || hersteller === undefined) return null;
  const differenz = lila - hersteller;
  if (Math.abs(differenz) < 0.05) return null;
  const staerke = Math.min(1, (Math.abs(differenz) / MAX) * 1.5);
  return Math.round(50 + Math.sign(differenz) * staerke * 50);
}

export function mische(a: Punkt, b: Punkt, t: number): Punkt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Weicher Bogen von links nach rechts wie auf dem Poster (kubische Bézierkurve). */
export function bogen(von: Punkt, nach: Punkt): string {
  const mitteX = (von.x + nach.x) / 2;
  return `M${von.x},${von.y} C${mitteX},${von.y} ${mitteX},${nach.y} ${nach.x},${nach.y}`;
}

export function alsPolygon(punkte: readonly Punkt[]): string {
  return punkte.map((p) => `${runde(p.x)},${runde(p.y)}`).join(" ");
}

const ACHSE_ZU_KATEGORIE = new Map<GeschmacksKategorie, keyof GeschmacksMatrix>(
  GESCHMACKS_ACHSEN.map((achse) => [achse.enumWert, achse.key]),
);

/**
 * Was die Herstellerangaben erwarten lassen: jedes angegebene Terpen zahlt
 * auf seine Geschmacksachse ein, gewichtet nach Konzentration, sonst nach
 * Rang (Rang 1 zählt am meisten). Die stärkste Achse wird auf 5 skaliert.
 * Ohne Terpenangaben: null.
 */
export function herstellerProfil(terpene: readonly KartenTerpen[]): GeschmacksMatrix | null {
  if (terpene.length === 0) return null;
  const matrix = leereGeschmacksMatrix();
  for (const terpen of terpene) {
    const gewicht = terpen.konzentrationProzent ?? Math.max(1, 4 - terpen.rang);
    // Ein Terpen zahlt anteilig auf alle seine Noten ein (lib/terpen-aromen.ts).
    for (const { geschmack, anteil } of aromaAnteile(terpen)) {
      const achse = ACHSE_ZU_KATEGORIE.get(geschmack);
      if (achse) matrix[achse] += gewicht * anteil;
    }
  }
  const hoechster = Math.max(...Object.values(matrix));
  if (hoechster <= 0) return null;
  for (const achse of Object.keys(matrix) as (keyof GeschmacksMatrix)[]) {
    matrix[achse] = Math.round((matrix[achse] / hoechster) * MAX * 10) / 10;
  }
  return matrix;
}

/**
 * Die Bögen eines Terpens: je Note die Achse und ihr Anteil (lib/terpen-aromen.ts).
 * Achsen, die es nicht gibt, fallen weg.
 */
export function terpenBoegen(terpen: KartenTerpen): { achse: number; anteil: number }[] {
  return aromaAnteile(terpen).flatMap(({ geschmack, anteil }) => {
    const achse = achsenIndex(geschmack);
    return achse < 0 ? [] : [{ achse, anteil }];
  });
}

/**
 * Reihenfolge der Terpene in der rechten Spalte (Nutzer 2026-09-26: Linien
 * schöner ordnen): jedes Terpen steht auf der Höhe des gewichteten Mittels
 * seiner Achsen (Baryzentrum), so laufen die Bögen möglichst parallel und
 * kreuzen sich selten. Gleichstand: Hauptnote, dann Name.
 */
export function ordneTerpene<T extends KartenTerpen>(terpene: readonly T[]): T[] {
  const lage = (terpen: T) => achsenLage(terpenBoegen(terpen));
  return [...terpene].sort(
    (a, b) => lage(a) - lage(b) || achsenIndex(a.geschmack) - achsenIndex(b.geschmack) || a.name.localeCompare(b.name, "de"),
  );
}

/** Gewichtetes Mittel der Achsen einer Bogengruppe; ohne Bögen ganz unten. */
export function achsenLage(boegen: readonly { achse: number; anteil: number }[]): number {
  const summe = boegen.reduce((a, b) => a + b.anteil, 0);
  return summe > 0 ? boegen.reduce((a, b) => a + b.achse * b.anteil, 0) / summe : GESCHMACKS_ACHSEN.length;
}

/** Bögen eines Begleitstoffs (Ester, Thiole) wie bei einem Terpen. */
export function begleitBoegen(noten: readonly { geschmack: GeschmacksKategorie; anteil: number }[]): { achse: number; anteil: number }[] {
  return noten.flatMap(({ geschmack, anteil }) => {
    const achse = achsenIndex(geschmack);
    return achse < 0 ? [] : [{ achse, anteil }];
  });
}

/** Index der Geschmacksachse, zu der ein Terpen gehört (Hauptnote). */
export function achsenIndex(kategorie: GeschmacksKategorie): number {
  return GESCHMACKS_ACHSEN.findIndex((achse) => achse.enumWert === kategorie);
}

/** Easing für den Morph: sanft an, sanft aus. */
export function sanft(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Das Herstellerprofil, wenn man die Terpene stärker oder schwächer schmeckt:
 * Stufe 3 (Sweet Spot) lässt ein Terpen unverändert, 1 halbiert es fast,
 * 5 verstärkt es. Skaliert auf denselben Höchstwert wie das Herstellerprofil,
 * damit die Abweichung auf der Karte sichtbar bleibt.
 */
export function eindruckProfil(
  terpene: readonly KartenTerpen[],
  stufen: Readonly<Record<string, number>>,
  ergaenzt: readonly KartenTerpen[] = [],
): GeschmacksMatrix | null {
  if (terpene.length === 0 && ergaenzt.length === 0) return null;
  const roh = leereGeschmacksMatrix();
  const basis = leereGeschmacksMatrix();
  for (const terpen of terpene) {
    const gewicht = terpen.konzentrationProzent ?? Math.max(1, 4 - terpen.rang);
    for (const { geschmack, anteil } of aromaAnteile(terpen)) {
      const achse = ACHSE_ZU_KATEGORIE.get(geschmack);
      if (!achse) continue;
      basis[achse] += gewicht * anteil;
      roh[achse] += gewicht * anteil * ((stufen[terpen.name] ?? 3) / 3);
    }
  }
  // Nicht angegebene Terpene: Gewicht 1, wie ein Terpen auf hinterem Rang.
  for (const terpen of ergaenzt) {
    for (const { geschmack, anteil } of aromaAnteile(terpen)) {
      const achse = ACHSE_ZU_KATEGORIE.get(geschmack);
      if (achse) roh[achse] += anteil * ((stufen[terpen.name] ?? 3) / 3);
    }
  }
  const hoechster = Math.max(1, ...Object.values(basis));
  if (hoechster <= 0) return null;
  for (const achse of Object.keys(roh) as (keyof GeschmacksMatrix)[]) {
    roh[achse] = Math.min(MAX, Math.round((roh[achse] / hoechster) * MAX * 10) / 10);
  }
  return roh;
}

/**
 * Stärke je Terpen, 0 bis 1: Gewicht (Konzentration, sonst Rang) mal Stufe/3,
 * bezogen auf das stärkste Terpen bei Stufe 5. Steuert, wie kräftig der Pfad
 * eines Terpens in der Karte leuchtet.
 */
export function terpenStaerken(
  terpene: readonly KartenTerpen[],
  stufen: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const gewichte = terpene.map((terpen) => terpen.konzentrationProzent ?? Math.max(1, 4 - terpen.rang));
  const hoechstes = Math.max(0, ...gewichte) * (5 / 3);
  return Object.fromEntries(
    terpene.map((terpen, index) => [
      terpen.name,
      hoechstes > 0 ? Math.min(1, (gewichte[index] * ((stufen[terpen.name] ?? 3) / 3)) / hoechstes) : 0,
    ]),
  );
}

/** Ein ergänztes Terpen als Kartenknoten: ohne Konzentration, hinterster Rang. */
export function ergaenztesTerpen(name: string, geschmack: GeschmacksKategorie): KartenTerpen {
  return { name, geschmack, konzentrationProzent: null, rang: 99 };
}

/**
 * Herstellertreue: wie nah ein geschmecktes Profil an dem liegt, was die
 * Herstellerangaben erwarten lassen. Summe der Minima durch Summe der Maxima
 * über alle Achsen (gewichtete Jaccard-Ähnlichkeit), 0 bis 1. Ein leeres
 * Profil ergibt null.
 */
export function herstellerTreue(hersteller: GeschmacksMatrix, profil: GeschmacksMatrix): number | null {
  let minima = 0;
  let maxima = 0;
  for (const achse of Object.keys(hersteller) as (keyof GeschmacksMatrix)[]) {
    minima += Math.min(hersteller[achse], profil[achse]);
    maxima += Math.max(hersteller[achse], profil[achse]);
  }
  const summeProfil = Object.values(profil).reduce((a, b) => a + b, 0);
  if (maxima <= 0 || summeProfil <= 0) return null;
  return minima / maxima;
}

export type Treue = { wert: number; anzahl: number };

/** Mittlere Herstellertreue über alle Bewertungen mit Geschmacksprofil; ohne Bewertungen null. */
export function mittlereHerstellerTreue(
  hersteller: GeschmacksMatrix | null,
  profile: readonly GeschmacksMatrix[],
): Treue | null {
  if (!hersteller) return null;
  const werte = profile.flatMap((profil) => {
    const wert = herstellerTreue(hersteller, profil);
    return wert === null ? [] : [wert];
  });
  if (werte.length === 0) return null;
  return { wert: werte.reduce((a, b) => a + b, 0) / werte.length, anzahl: werte.length };
}
