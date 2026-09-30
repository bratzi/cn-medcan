/**
 * Geometrie und Daten der Aroma-Karte (Spec Redesign 14): links die zehn
 * Geschmacksachsen, rechts die Terpene, dazwischen Bögen wie auf einem
 * Terpen-Poster; per Schalter morphen die Knoten ins Netzdiagramm. Reine
 * Funktionen, damit Darstellung und Verdichtung testbar bleiben.
 */
import { abweichungZurCommunity, QUALITAET_MITTE, qualitaetsScore } from "@/lib/bewertung-v2";
import {
  GESCHMACKS_ACHSEN,
  geschmacksMatrixSchema,
  leereGeschmacksMatrix,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";
import { aromaAnteile } from "@/lib/terpen-aromen";

export type Punkt = { x: number; y: number };
export type KartenTerpen = { name: string; geschmack: GeschmacksKategorie; konzentrationProzent: number | null; rang: number };

/** Ein bekanntes Terpen des Katalogs, auch ohne Herstellerangabe in dieser Sorte. */
export type KatalogEintrag = { name: string; geschmack: GeschmacksKategorie };

export type TerpenZeile = {
  terpen: string;
  /** Community-Median (T5, zuvor das Mittel), 0 bis 5. */
  wert: number;
  /** Wie viele Bewertungen dahinterstehen; ohne Anzahl kein Community-Ring. */
  anzahl?: number;
};

export const BREITE = 640;
export const HOEHE = 480;
export const MAX = 5;
// Seit 2026-09-25 (Nutzer: Linien laenger, nicht groesser): die Achsenspalte bleibt
// fest bei 260 (Platz fuer Beschriftung und Balken), die Terpenspalte haengt 220 vor
// dem rechten Rand (Platz fuer die Namen). Bei breiter Karte wachsen nur die Boegen.
const LINKS = 260;
/**
 * Balken beginnen am linken Rand (Nutzer 2026-09-26: Karte über die volle Breite
 * wie die Balken von Overall und Qualität); die Achsennamen stehen über dem Balken. 14 Rand, damit Skala und Griffe bei 5 nicht abgeschnitten werden.
 */
const BESCHRIFTUNG = 14;

/**
 * Die Geschmacksachse wandert mit der halben Mehrbreite nach rechts (Nutzer
 * 2026-09-25: Skala links und Terpenlinien rechts auf breiten Schirmen etwa
 * 50:50); bei BREITE bleibt sie bei 260, damit schmale Karten Platz für die
 * Bögen behalten. Die Balken füllen den Raum zwischen Beschriftung und Achse.
 */
export function achsenX(breite: number = BREITE): number {
  // Unter BREITE (Handy, seit 2026-09-27) wird die Karte nicht mehr verkleinert, sondern
  // schmal gesetzt: die Achse steht bei 42 % der Breite.
  if (breite < BREITE) return runde(breite * 0.42);
  return runde(LINKS + Math.max(0, breite - BREITE) * 0.5);
}

/** Kleinste Breite, in der die Karte gesetzt wird; darunter wird sie verkleinert. */
export const MIN_BREITE = 320;

export function balkenLaenge(breite: number = BREITE): number {
  return runde(achsenX(breite) - 16 - BESCHRIFTUNG);
}
/** Platz rechts der Terpenknoten für die Namen (HTML, feste Größe). */
const RECHTS_ABSTAND = 150;
/** Auf schmalen Karten weniger Platz rechts; lange Namen brechen dort um. */
const RECHTS_ABSTAND_SCHMAL = 124;
const OBEN = 48;
/** Rand unten wie oben (Skala unter der letzten Achse). */
const RAND_UNTEN = 48;
export const RADIUS = 180;

/**
 * Zeilenabstand der Terpenspalte mit Reglern (Nutzer 2026-09-30: die Terpen-Regler
 * wandern in die Karte): Name darüber, Spur darunter, Trefferfläche 44 hoch.
 */
export const REIHE = 44;

/**
 * Höhe der Karte mit Terpen-Reglern: so hoch, dass jede Zeile der rechten Spalte
 * (`anzahl` inklusive Begleitstoffe) ihre REIHE bekommt, nie niedriger als `hoehe`.
 */
export function kartenHoeheMitReglern(anzahl: number, hoehe: number): number {
  return Math.max(hoehe, OBEN + RAND_UNTEN + (anzahl - 1) * REIHE);
}

/**
 * Netzradius: RADIUS, auf schmalen Karten so klein, dass die Achsennamen am Rand
 * Platz haben; auf niedrigen Karten (Buch ab lg, T7b, Nutzer 2026-09-30) so
 * klein, dass Netz und Namen (radius + 34) in die Höhe passen. Bei HOEHE bleibt
 * es bei RADIUS.
 */
export function radiusVon(breite: number = BREITE, hoehe: number = HOEHE): number {
  return Math.min(RADIUS, runde(breite / 2 - 80), runde(hoehe / 2 - 60));
}

const runde = (zahl: number) => Math.round(zahl * 10) / 10 + 0;

/**
 * Mittelpunkt des Netzes für eine gegebene Kartenbreite: bleibt in der Mitte
 * der (ggf. breiteren) Karte; die Höhe und damit RADIUS ändern sich nicht,
 * das Netz bleibt also immer gleich groß, nur zentriert auf breite/2.
 */
export function mitteVon(breite: number = BREITE, hoehe: number = HOEHE): Punkt {
  return { x: breite / 2, y: hoehe / 2 };
}

export const MITTE: Punkt = mitteVon();

/** Gleichmäßig verteilte y-Positionen einer Spalte. */
function spalte(anzahl: number, index: number, hoehe: number = HOEHE): number {
  if (anzahl <= 1) return hoehe / 2;
  return runde(OBEN + ((hoehe - RAND_UNTEN - OBEN) / (anzahl - 1)) * index);
}

/** Knoten der Geschmacksachsen in der Karten-Ansicht (linke Spalte). */
export function achsenImKarte(breite: number = BREITE, hoehe: number = HOEHE): Punkt[] {
  const x = achsenX(breite);
  return GESCHMACKS_ACHSEN.map((_, index) => ({ x, y: spalte(GESCHMACKS_ACHSEN.length, index, hoehe) }));
}

/** Knoten der Terpene (rechte Spalte). */
export function terpeneImKarte(anzahl: number, breite: number = BREITE, hoehe: number = HOEHE): Punkt[] {
  const x = runde(breite - (breite < BREITE ? RECHTS_ABSTAND_SCHMAL : RECHTS_ABSTAND));
  return Array.from({ length: anzahl }, (_, index) => ({ x, y: spalte(anzahl, index, hoehe) }));
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

// ---------------------------------------------------------------------------
//  Drei Ebenen der Karte (Masterplan Bewertung v2, T5, Nutzer 2026-09-29)
// ---------------------------------------------------------------------------

/**
 * Denkfehler bis T5: ein Geschmack aktivierte alle Terpene, die ihn tragen,
 * auch solche, die gar nicht in der Sorte stecken. Jetzt hat jedes Terpen der
 * Karte eine Ebene:
 * - `hersteller`: laut Herstellerangabe enthalten (seit T5b stiller Streifen),
 * - `ergaenzt`: der Nutzer hat es selbst im Sweet Spot gesetzt (Stufe > 0),
 * - `geist`: nur über den Geschmack verbunden, laut Hersteller nicht enthalten.
 */
export type TerpenEbene = "hersteller" | "ergaenzt" | "geist";

export function terpenEbenen(
  namen: readonly string[],
  hersteller: readonly string[],
  eigene: Readonly<Record<string, number>>,
): Record<string, TerpenEbene> {
  const angegeben = new Set(hersteller);
  return Object.fromEntries(
    namen.map((name) => [name, angegeben.has(name) ? "hersteller" : (eigene[name] ?? 0) > 0 ? "ergaenzt" : "geist"]),
  );
}

/** Ergänzte Terpene leuchten höchstens so stark (Stufe 5), damit die Herstellerangabe führt. */
const ERGAENZT_HOECHSTENS = 0.6;

/**
 * Leuchtkraft je Terpen, 0 bis 1: Herstellerterpene wie `terpenStaerken`, aber
 * nur untereinander verglichen (Katalogterpene verwässern die Angabe nicht);
 * ergänzte nach der eigenen Stufe; Geister 0, ein Geschmack allein zündet sie nicht.
 */
export function ebenenStaerken(
  terpene: readonly KartenTerpen[],
  ebenen: Readonly<Record<string, TerpenEbene>>,
  stufen: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const hersteller = terpenStaerken(
    terpene.filter((terpen) => ebenen[terpen.name] === "hersteller"),
    stufen,
  );
  return Object.fromEntries(
    terpene.map((terpen) => {
      const ebene = ebenen[terpen.name] ?? "geist";
      if (ebene === "hersteller") return [terpen.name, hersteller[terpen.name] ?? 0];
      if (ebene === "ergaenzt") return [terpen.name, Math.min(1, (stufen[terpen.name] ?? 0) / MAX) * ERGAENZT_HOECHSTENS];
      return [terpen.name, 0];
    }),
  );
}

// ---------------------------------------------------------------------------
//  Karte v2: nur die eigene Bewertung bewegt sich (T5b, Nutzer 2026-09-29)
// ---------------------------------------------------------------------------

/** Ab diesem Wert ist eine Geschmacksrichtung spürbar: Balken und Linie erscheinen. */
export const SPUERBAR = 0.05;

/** Nebennoten zeichnen feiner als die Hauptnote (Anteil 0 bis 1). */
const notenGewicht = (anteil: number) => 0.35 + 0.65 * anteil;
const zweiStellen = (zahl: number) => Math.round(zahl * 100) / 100;

/**
 * Breite der eigenen Linie über dem Streifen (Nutzer 2026-09-29: „desto
 * weniger, desto dünner“): ohne spürbaren Wert keine Linie, sonst 1,5 px bei
 * 0,5 bis 6 px bei 5, mal dem Notenanteil, damit Nebennoten feiner bleiben.
 */
export function linienBreite(wert: number, anteil = 1): number {
  if (!(wert > SPUERBAR)) return 0;
  return zweiStellen((1 + Math.min(wert, MAX)) * notenGewicht(anteil));
}

const FLUSS_LANGSAM = 6;
const FLUSS_SCHNELL = 1.2;

/**
 * Dauer eines Lichtflusses in Sekunden (Nutzer 2026-09-29: „desto stärker,
 * desto schneller“): 6 s bei 0,5, 1,2 s bei 5. Geometrisch dazwischen, damit
 * jeder halbe Schritt gleich stark schneller wirkt (Tempo wird als Verhältnis
 * wahrgenommen); auf Zehntel gerundet, damit sich die Dauer beim Ziehen nur in
 * Stufen ändert.
 */
export function flussDauer(wert: number): number {
  const anteil = (Math.min(Math.max(wert, 0.5), MAX) - 0.5) / (MAX - 0.5);
  return Math.round(FLUSS_LANGSAM * (FLUSS_SCHNELL / FLUSS_LANGSAM) ** anteil * 10) / 10;
}

/** Kürzester Lichtstrich (Anteil der Bogenlänge, pathLength 100), wie der frühere Lichtpunkt. */
const STRICH_KURZ = 6;

/**
 * Länge des animierten Abschnitts einer Terpen-Linie (T5d, Nutzer 2026-09-30:
 * „desto weniger Regler desto kürzer die animierte Linie, desto stärker desto
 * länger“): 6 bei 0,5 bis 100 bei 5, linear, ganzzahlig. Am Maximum läuft die
 * Linie durchgehend und pulsiert statt zu fließen.
 */
export function flussStrich(wert: number): { laenge: number; durchgehend: boolean } {
  if (wert >= MAX) return { laenge: 100, durchgehend: true };
  const anteil = (Math.min(Math.max(wert, 0.5), MAX) - 0.5) / (MAX - 0.5);
  return { laenge: Math.round(STRICH_KURZ + (100 - STRICH_KURZ) * anteil), durchgehend: false };
}

// ---------------------------------------------------------------------------
//  Sweet-Spot-Skala der Geschmäcker (Nutzer 2026-09-30)
// ---------------------------------------------------------------------------

/**
 * Die Geschmacksskala ist eine Sweet-Spot-Skala (Nutzer 2026-09-30): 0 zu wenig,
 * 2,5 genau richtig, 5 zu viel. Stärke der Linie daraus, 0,5 bis 5, damit
 * `linienBreite`, `flussDauer` und `flussStrich` unverändert bleiben: genau im
 * Sweet Spot 5 (dick, schnell, durchgehend pulsierend), an beiden Rändern 0,5
 * (dünn, langsam, kurzer Lichtstrich). Ohne spürbaren Wert 0, keine Linie.
 */
export function sweetSpotStaerke(wert: number): number {
  if (!(wert > SPUERBAR)) return 0;
  return zweiStellen(0.5 + 4.5 * qualitaetsScore(wert));
}

/** Regler steht genau im Sweet Spot; die Toleranz fängt nur Rundungsrauschen ab. */
export function imSweetSpot(wert: number): boolean {
  return Math.abs(wert - QUALITAET_MITTE) < 0.01;
}

/**
 * Skalenwerte der Funken rund um den Griff, wenn ein Geschmacksregler genau im
 * Sweet Spot steht (Nutzer 2026-09-30: „Die Funken funken nur, wenn der Regler
 * direkt auf dem Sweet Spot in der Mitte ist“). Sechs, damit Partikel günstig bleiben.
 */
export const SWEET_SPOT_FUNKEN: readonly number[] = [2.1, 2.25, 2.4, 2.6, 2.75, 2.9];

/** Halbe Breite der Zone „Sweet Spot“ für Vorleser, um die Mitte herum. */
const SWEET_ZONE = 0.25;

/**
 * Zone eines Geschmackswerts auf der Sweet-Spot-Skala für den Vorlesetext der
 * Regler: unter 2,25 zu wenig, 2,25 bis 2,75 Sweet Spot, darüber zu viel.
 */
export function sweetSpotZone(wert: number): "wenig" | "mitte" | "viel" {
  if (wert < QUALITAET_MITTE - SWEET_ZONE) return "wenig";
  if (wert > QUALITAET_MITTE + SWEET_ZONE) return "viel";
  return "mitte";
}

/** Unterschied, ab dem ein Balken über oder unter seinem Bezug liegt (sonst gleichauf). */
const GLEICHAUF = 0.1;

export type BalkenVergleich = {
  ton: "gruen" | "lila";
  /** Pulsierendes Stück zwischen Bezug und Balkenende; gleichauf oder ohne Bezug null. */
  puls: { art: "ueber" | "fehlt"; von: number; bis: number } | null;
};

/**
 * Farbe und Puls des Bewertungsbalkens (Nutzer 2026-09-29): über dem Bezug
 * (Community-Median, in der Anzeige die grüne Serie) lila, der Überstand
 * pulsiert; auf oder unter ihm grün, das Fehlstück bis zum Bezug pulsiert;
 * gleichauf grün ohne Puls. Ohne Bezug lila, kein Vergleich. Ohne eigenen
 * Wert gibt es keinen Balken und kein Fehlstück, die Karte zeigt nur Streifen.
 */
export function balkenVergleich(wert: number, bezug: number | null | undefined): BalkenVergleich {
  if (bezug === null || bezug === undefined) return { ton: "lila", puls: null };
  const differenz = wert - bezug;
  if (differenz >= GLEICHAUF) return { ton: "lila", puls: { art: "ueber", von: bezug, bis: wert } };
  if (!(wert > SPUERBAR) || differenz > -GLEICHAUF) return { ton: "gruen", puls: null };
  return { ton: "gruen", puls: { art: "fehlt", von: wert, bis: bezug } };
}

/**
 * Der stille Streifen der Herstellerangabe hinter der Linie: breit und blass
 * (3 bis 14 px, Deckkraft 0,12 bis 0,3), nach Ausprägung aus Kraft des Terpens
 * (0 bis 1) und Notenanteil. Er bewegt sich nie.
 */
export function streifen(kraft: number, anteil: number): { breite: number; deckkraft: number } {
  const auspraegung = Math.min(Math.max(kraft, 0), 1) * (0.4 + 0.6 * anteil);
  return { breite: zweiStellen(3 + 11 * auspraegung), deckkraft: zweiStellen(0.12 + 0.18 * auspraegung) };
}

/**
 * Kraft je angegebenem Terpen, 0 bis 1, allein aus der Herstellerangabe
 * (Konzentration, sonst Rang): das stärkste ist 1. Eigene Stufen fließen nicht
 * ein, der Streifen gehört dem Hersteller.
 */
export function herstellerKraft(terpene: readonly KartenTerpen[]): Record<string, number> {
  const gewichte = terpene.map((terpen) => terpen.konzentrationProzent ?? Math.max(1, 4 - terpen.rang));
  const hoechstes = Math.max(0, ...gewichte);
  return Object.fromEntries(terpene.map((terpen, index) => [terpen.name, hoechstes > 0 ? gewichte[index] / hoechstes : 0]));
}

export type BogenSchicht = {
  /** Stiller Streifen der Herstellerangabe. */
  streifen: boolean;
  /** Bunte Linie der Bewertung mit Lichtfluss. */
  linie: boolean;
  /** Dünner grauer Bogen für Terpene ohne Herstellerangabe und ohne Linie. */
  geist: "blass" | "fokus" | null;
};

/**
 * Was ein Bogen Geschmack → Terpen zeigt (T5b): Terpene laut Hersteller immer
 * ihren Streifen; die Linie nur, wenn die Bewertung auf der Achse einen Wert
 * hat und die Achse im Blick ist (keine andere gewählt) oder man das Terpen
 * selbst überfährt. Ergänzte Terpene tragen keine Herstellerangabe, also nur
 * die Linie; Geister (T5) bekommen nie eine Linie, ein Geschmack allein zündet
 * kein Terpen, das nicht in der Sorte steckt.
 */
export function bogenSchicht({
  ebene,
  wert,
  imBlick,
  imFokus,
}: {
  ebene: TerpenEbene;
  wert: number;
  imBlick: boolean;
  imFokus: boolean;
}): BogenSchicht {
  const linie = ebene !== "geist" && wert > SPUERBAR && (imBlick || imFokus);
  // Keine Herstellerstreifen mehr (Nutzer 2026-09-30): der Hersteller nennt nur welche Terpene, nicht wie stark.
  const geist = linie ? null : ebene === "geist" && imFokus ? "fokus" : "blass";
  return { streifen: false, linie, geist };
}

/**
 * Welche eigenen Terpenstufen zählen: ein Herstellerterpen auf 0 heißt „nicht
 * geschmeckt“ und zählt; ein ergänztes auf 0 ist nicht ergänzt und fällt weg
 * (T5). Eine Regel für die versteckten Felder der Maske und die Abweichung.
 */
export function gezaehlteTerpene(
  eigene: Readonly<Record<string, number>>,
  hersteller: readonly string[],
): Record<string, number> {
  const angegeben = new Set(hersteller);
  return Object.fromEntries(Object.entries(eigene).filter(([name, wert]) => angegeben.has(name) || wert > 0));
}

/**
 * Wählt man eine Geschmacksrichtung, leuchten nur Terpene der Sorte (Ebene 1
 * und 2), die sie spürbar tragen (Anteil ab 20 %); die übrigen bleiben Geister.
 */
export function leuchtendeTerpene(
  achse: number,
  terpene: readonly KartenTerpen[],
  ebenen: Readonly<Record<string, TerpenEbene>>,
): string[] {
  return terpene
    .filter((terpen) => (ebenen[terpen.name] ?? "geist") !== "geist")
    .filter((terpen) => terpenBoegen(terpen).some((b) => b.achse === achse && b.anteil >= 0.2))
    .map((terpen) => terpen.name);
}

/** Community-Median einer Sorte aus `sorten_kennwerte` (T3), beim Speichern vorberechnet. */
export type CommunityMedian = {
  /** Median je Geschmacksrichtung; null, wenn die Spalte unbrauchbar ist. */
  geschmack: GeschmacksMatrix | null;
  /** Median der Terpen-Intensität je Terpen (0 bis 5, auch halbe Werte). */
  terpene: Record<string, number>;
  anzahl: number;
};

function alsObjekt(roh: unknown): unknown {
  if (typeof roh !== "string") return roh;
  try {
    return JSON.parse(roh);
  } catch {
    return undefined;
  }
}

/**
 * Liest die Kennwerte der Sorte. Ohne Zeile, ohne Bewertung oder ohne
 * brauchbaren Wert: null, damit nirgends 0 oder NaN als Community-Wert steht
 * (Review Focus 1). Die JSON-Spalten werden wie überall geprüft gelesen.
 */
export function communityMedian(
  roh: { terpenMedian: unknown; geschmackMedian: unknown; anzahl: number } | null | undefined,
): CommunityMedian | null {
  if (!roh || !(roh.anzahl > 0)) return null;
  const matrix = geschmacksMatrixSchema.safeParse(alsObjekt(roh.geschmackMedian));
  const terpenRoh = alsObjekt(roh.terpenMedian);
  const terpene =
    terpenRoh && typeof terpenRoh === "object" && !Array.isArray(terpenRoh)
      ? Object.fromEntries(
          Object.entries(terpenRoh).filter(
            (eintrag): eintrag is [string, number] =>
              typeof eintrag[1] === "number" && Number.isFinite(eintrag[1]) && eintrag[1] >= 0 && eintrag[1] <= MAX,
          ),
        )
      : {};
  const geschmack = matrix.success ? matrix.data : null;
  if (!geschmack && Object.keys(terpene).length === 0) return null;
  return { geschmack, terpene, anzahl: roh.anzahl };
}

/**
 * „Deine Nase vs. Community“: mittlere |Δ| der eigenen Terpenstufen zum
 * Community-Median (über die Terpene, die beide haben, lib/bewertung-v2.ts)
 * und die Zahl der Terpene, die man ohne Herstellerangabe ergänzt hat (Stufe
 * > 0). Ohne eigene Werte, ohne Median oder ohne Überschneidung: null.
 */
export function nasenAbweichung(
  eigene: Readonly<Record<string, number>>,
  median: Readonly<Record<string, number>> | null,
  hersteller: readonly string[],
): { delta: number; ergaenzt: number } | null {
  if (!median) return null;
  // Ein ergänztes Terpen auf 0 zurückgezogen gilt als nicht ergänzt.
  const { mittlereAbweichung, ergaenzt } = abweichungZurCommunity(gezaehlteTerpene(eigene, hersteller), median, hersteller);
  if (mittlereAbweichung === null) return null;
  return { delta: mittlereAbweichung, ergaenzt: ergaenzt.length };
}
