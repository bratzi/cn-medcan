import { GESCHMACKS_KATEGORIEN, istGeschmacksKategorie, type GeschmacksKategorie } from "@/db/enums";
import type { Werte } from "@/lib/bewertung-v2";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { aromaAnteile } from "@/lib/terpen-aromen";

/**
 * Persönliche Empfehlungen nach ähnlichem Aroma (Masterplan Bewertung v2, T11,
 * Nutzer 2026-09-29). Nur Terpene und Geschmäcker, nie Wirkung (HWG).
 *
 * Ein Aromavektor hat zwei Arten Schlüssel: `t:<Terpenname wie in der Datenbank>` und
 * `g:<GeschmacksKategorie>`. Eine Sorte bringt die Herstellerterpene nach
 * Rang (1/rang) und deren Geschmacksanteile mit, dazu den Community-Median
 * des Geschmacks, falls vorhanden. Eine Bewertung legt die Regler des Nutzers
 * darüber. Das Profil ist die gewichtete Summe aller Bewertungen: ab 3,5
 * positiv, bis 2 negativ, dazwischen ohne Einfluss. Gerechnet wird beim
 * Speichern einer Bewertung, nie je Seitenaufruf (CPU-Limit 10 ms).
 */
export type Vektor = Map<string, number>;

export type SortenAroma = {
  strainId: string;
  terpene: readonly { name: string; geschmack: GeschmacksKategorie; rang: number }[];
  /** Community-Median je Geschmacksachse (Schlüssel wie `zitrus`, 0-5). */
  geschmackMedian?: Werte;
};

export type EigeneBewertung = {
  strainId: string;
  gesamtnote: number | null;
  /** Regler: Terpenname zu 0-5. */
  terpene: Werte;
  /** Regler: Geschmacksachse (`zitrus`) zu 0-5. */
  geschmack: Werte;
};

export type Empfehlung = {
  strainId: string;
  rang: number;
  score: number;
  /** Die gut bewertete Sorte, der die Empfehlung am nächsten ist. */
  bezugStrainId: string;
  /** Bis zu drei gemeinsame Schlüssel (`t:Myrcen`, `g:ZITRUS`), stärkste zuerst. */
  gemeinsam: string[];
};

export const EMPFEHLUNGEN_ANZAHL = 6;

const ACHSE_ZU_ENUM = new Map<string, GeschmacksKategorie>(GESCHMACKS_ACHSEN.map((a) => [a.key, a.enumWert]));

function addiere(v: Vektor, schluessel: string, wert: number): void {
  if (wert !== 0) v.set(schluessel, (v.get(schluessel) ?? 0) + wert);
}

function norm(v: Vektor): number {
  let summe = 0;
  for (const x of v.values()) summe += x * x;
  return Math.sqrt(summe);
}

function normiert(v: Vektor): Vektor {
  const n = norm(v);
  if (n === 0) return v;
  const aus: Vektor = new Map();
  for (const [k, x] of v) aus.set(k, x / n);
  return aus;
}

/** Kosinus-Ähnlichkeit; leere Vektoren ergeben 0. */
export function kosinus(a: Vektor, b: Vektor): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  const [klein, gross] = a.size <= b.size ? [a, b] : [b, a];
  let skalar = 0;
  for (const [k, x] of klein) skalar += x * (gross.get(k) ?? 0);
  return skalar / (na * nb);
}

// Schlüssel und Geschmacksanteile je Terpen einmal bilden: es gibt nur wenige
// Dutzend Terpene, die Rechnung über 700 Sorten fragt sie tausendfach ab.
const TERPEN_CACHE = new Map<string, { schluessel: string; noten: [string, number][] }>();
function terpenSchluessel(terpen: { name: string; geschmack: GeschmacksKategorie }) {
  const id = `${terpen.name}|${terpen.geschmack}`;
  let eintrag = TERPEN_CACHE.get(id);
  if (!eintrag) {
    eintrag = {
      schluessel: `t:${terpen.name.trim()}`,
      noten: aromaAnteile(terpen).map((a): [string, number] => [`g:${a.geschmack}`, a.anteil]),
    };
    if (TERPEN_CACHE.size < 500) TERPEN_CACHE.set(id, eintrag);
  }
  return eintrag;
}

/** Aromavektor einer Sorte aus Herstellerterpenen und Community-Geschmack. */
export function sortenVektor(sorte: SortenAroma): Vektor {
  const v: Vektor = new Map();
  for (const terpen of sorte.terpene) {
    const gewicht = 1 / Math.max(1, terpen.rang);
    const { schluessel, noten } = terpenSchluessel(terpen);
    addiere(v, schluessel, gewicht);
    for (const [g, anteil] of noten) addiere(v, g, gewicht * anteil);
  }
  for (const [achse, wert] of Object.entries(sorte.geschmackMedian ?? {})) {
    const kategorie = ACHSE_ZU_ENUM.get(achse);
    if (kategorie) addiere(v, `g:${kategorie}`, wert / 5);
  }
  return v;
}

/** Gewicht einer Bewertung im Profil: ab 3,5 positiv, bis 2 negativ, sonst 0. */
export function bewertungsGewicht(gesamtnote: number | null): number {
  if (gesamtnote === null) return 0;
  if (gesamtnote >= 3.5) return gesamtnote - 2.5;
  if (gesamtnote <= 2) return gesamtnote - 2.5;
  return 0;
}

/** Vektor einer Bewertung: die Sorte, überlagert von den Reglern des Nutzers (je normiert). */
function bewertungsVektor(bewertung: EigeneBewertung, sorte: SortenAroma | undefined): Vektor {
  const regler: Vektor = new Map();
  for (const [name, wert] of Object.entries(bewertung.terpene)) addiere(regler, `t:${name.trim()}`, wert / 5);
  for (const [achse, wert] of Object.entries(bewertung.geschmack)) {
    const kategorie = ACHSE_ZU_ENUM.get(achse);
    if (kategorie) addiere(regler, `g:${kategorie}`, wert / 5);
  }
  const v = sorte ? normiert(sortenVektor(sorte)) : new Map<string, number>();
  const aus: Vektor = new Map(v);
  for (const [k, x] of normiert(regler)) addiere(aus, k, x);
  return aus;
}

/** Bis zu drei gemeinsame Aromen: zwei Terpene, ein Geschmack, stärkste Überschneidung zuerst. */
function gemeinsameAromen(a: Vektor, b: Vektor): string[] {
  const paare: [string, number][] = [];
  for (const [k, x] of a) {
    const y = b.get(k) ?? 0;
    if (x > 0 && y > 0) paare.push([k, Math.min(x, y)]);
  }
  paare.sort((p, q) => q[1] - p[1]);
  const terpene = paare.filter(([k]) => k.startsWith("t:")).slice(0, 2);
  const geschmack = paare.filter(([k]) => k.startsWith("g:")).slice(0, 3 - terpene.length);
  return [...terpene, ...geschmack].map(([k]) => k);
}

function profilAus(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]) {
  const jeId = new Map(sorten.map((s) => [s.strainId, s]));
  const profil: Vektor = new Map();
  const positive: { strainId: string; vektor: Vektor }[] = [];
  const bewertet = new Set<string>();
  for (const bewertung of bewertungen) {
    bewertet.add(bewertung.strainId);
    const gewicht = bewertungsGewicht(bewertung.gesamtnote);
    if (gewicht === 0) continue;
    const v = normiert(bewertungsVektor(bewertung, jeId.get(bewertung.strainId)));
    for (const [k, x] of v) addiere(profil, k, gewicht * x);
    if (gewicht > 0) positive.push({ strainId: bewertung.strainId, vektor: v });
  }
  return { profil, positive, bewertet };
}

/**
 * Terpengewichte des Profils je Terpen-Id (für `KANDIDATEN_SQL`). `sorten`
 * braucht nur die bewerteten Sorten. Ohne positive Bewertung leer.
 */
export function profilTerpene(
  bewertungen: readonly EigeneBewertung[],
  sorten: readonly SortenAroma[],
  terpene: readonly TerpenZeile[],
): Record<string, number> {
  const { profil, positive } = profilAus(bewertungen, sorten);
  const aus: Record<string, number> = {};
  if (positive.length === 0) return aus;
  for (const t of terpene) {
    const x = profil.get(`t:${t.name.trim()}`);
    if (x) aus[t.id] = x;
  }
  return aus;
}

/**
 * Top 6 nicht bewerteter Sorten nach Kosinus zum Profil. Negative Bewertungen
 * gehen mit negativem Gewicht ins Profil und ziehen so ähnliche Sorten ab.
 * Nur Sorten mit positivem Score werden empfohlen.
 */
export function empfehlungenBerechnen(
  bewertungen: readonly EigeneBewertung[],
  sorten: readonly SortenAroma[],
  anzahl = EMPFEHLUNGEN_ANZAHL,
): Empfehlung[] {
  const { profil, positive, bewertet } = profilAus(bewertungen, sorten);
  if (positive.length === 0) return [];

  // Dicht gerechnet (Review T11, CPU 10 ms): ein Schlüsselindex, je Terpen die
  // Beiträge einmal als [Index, Wert, …], je Sorte ein wiederverwendetes Array.
  // Keine Map je Sorte; Profilschlüssel liegen vorne (Index < p).
  const index = new Map<string, number>();
  const idx = (k: string): number => {
    let i = index.get(k);
    if (i === undefined) index.set(k, (i = index.size));
    return i;
  };
  for (const k of profil.keys()) idx(k);
  const p = index.size;
  for (const kategorie of GESCHMACKS_KATEGORIEN) idx(`g:${kategorie}`);
  const achsenIndex = new Map<string, number>();
  for (const [achse, kategorie] of ACHSE_ZU_ENUM) achsenIndex.set(achse, idx(`g:${kategorie}`));
  // Nach Name, dann Geschmack: kein zusammengesetzter Schlüssel je Aufruf.
  const beitraege = new Map<string, Map<GeschmacksKategorie, number[]>>();
  const beitragVon = (terpen: { name: string; geschmack: GeschmacksKategorie }): number[] => {
    let jeGeschmack = beitraege.get(terpen.name);
    if (!jeGeschmack) beitraege.set(terpen.name, (jeGeschmack = new Map()));
    let liste = jeGeschmack.get(terpen.geschmack);
    if (!liste) {
      const { schluessel, noten } = terpenSchluessel(terpen);
      liste = [idx(schluessel), 1];
      for (const [g, anteil] of noten) liste.push(idx(g), anteil);
      jeGeschmack.set(terpen.geschmack, liste);
    }
    return liste;
  };

  const profilDicht = new Float64Array(p);
  const positivesTerpen = new Uint8Array(p);
  for (const [k, x] of profil) {
    const i = index.get(k)!;
    profilDicht[i] = x;
    if (x > 0 && k.startsWith("t:")) positivesTerpen[i] = 1;
  }
  const profilNorm = norm(profil);
  // Neue Terpenschlüssel entstehen erst in der Schleife; Platz für viele
  // (heute rund 30 Terpene). Was darüber hinausgeht, fällt aus der Norm.
  const platz = index.size + 4096;
  const werte = new Float64Array(platz);
  const belegt = new Uint8Array(platz);
  const beruehrt: number[] = [];
  const kandidaten: { strainId: string; score: number; sorte: SortenAroma }[] = [];
  for (const sorte of sorten) {
    if (bewertet.has(sorte.strainId)) continue;
    // Nur Sorten mit mindestens einem Terpen, das im Profil positiv zählt.
    let teilt = false;
    for (const terpen of sorte.terpene) {
      const liste = beitragVon(terpen);
      if (liste[0] < p && positivesTerpen[liste[0]] === 1) teilt = true;
      const gewicht = 1 / Math.max(1, terpen.rang);
      for (let j = 0; j < liste.length; j += 2) {
        const i = liste[j];
        if (i >= platz) continue;
        if (!belegt[i]) {
          belegt[i] = 1;
          beruehrt.push(i);
        }
        werte[i] += gewicht * liste[j + 1];
      }
    }
    const median = teilt ? sorte.geschmackMedian : undefined;
    if (median) {
      for (const achse in median) {
        const i = achsenIndex.get(achse);
        if (i === undefined) continue;
        if (!belegt[i]) {
          belegt[i] = 1;
          beruehrt.push(i);
        }
        werte[i] += median[achse] / 5;
      }
    }
    let skalar = 0;
    let summe = 0;
    for (const i of beruehrt) {
      summe += werte[i] * werte[i];
      if (i < p) skalar += werte[i] * profilDicht[i];
      werte[i] = 0;
      belegt[i] = 0;
    }
    beruehrt.length = 0;
    if (!teilt) continue;
    const score = summe === 0 || profilNorm === 0 ? 0 : skalar / (Math.sqrt(summe) * profilNorm);
    if (score > 0) kandidaten.push({ strainId: sorte.strainId, score, sorte });
  }
  kandidaten.sort((a, b) => b.score - a.score || (a.strainId < b.strainId ? -1 : a.strainId > b.strainId ? 1 : 0));

  return kandidaten.slice(0, anzahl).map((kandidat, i) => {
    const k = { ...kandidat, vektor: sortenVektor(kandidat.sorte) };
    let bezug = positive[0];
    let beste = -Infinity;
    for (const p of positive) {
      const s = kosinus(k.vektor, p.vektor);
      if (s > beste) {
        beste = s;
        bezug = p;
      }
    }
    return {
      strainId: k.strainId,
      rang: i + 1,
      score: k.score,
      bezugStrainId: bezug.strainId,
      gemeinsam: gemeinsameAromen(normiert(k.vektor), bezug.vektor),
    };
  });
}

/** So viele Kandidaten liefert D1 vorsortiert; genau gerechnet wird nur über sie. */
export const KANDIDATEN_ANZAHL = 150;

const AROMA_SPALTEN = `s.id AS sid,
           GROUP_CONCAT(st.terpen_id || ':' || st.rang, ',') AS tp,
           k.geschmack_median AS gm`;

/**
 * Aroma bestimmter Sorten, eine Zeile je Sorte: `tp` ist „terpenId:rang,…“,
 * `gm` der Community-Geschmacksmedian als JSON. Parameter: JSON-Liste der Ids.
 */
export const SORTEN_AROMA_SQL = `
    SELECT ${AROMA_SPALTEN}
    FROM strains s
    JOIN strain_terpene st ON st.strain_id = s.id
    LEFT JOIN sorten_kennwerte k ON k.strain_id = s.id AND k.anzahl > 0
    WHERE s.id IN (SELECT value FROM json_each(?))
    GROUP BY s.id
    ORDER BY s.id`;

/**
 * Vorauswahl in D1 (Review T11, CPU 10 ms): aktive, nicht bewertete Sorten,
 * sortiert nach dem Kosinus ihrer Herstellerterpene (1/Rang) zu den
 * Terpengewichten des Profils, nur mit positivem Skalarprodukt. Der Worker
 * rechnet danach genau, aber nur über diese Kandidaten statt über alle 700.
 * Parameter: JSON {terpenId: Gewicht}, JSON-Liste bewerteter Ids, Anzahl.
 */
export const KANDIDATEN_SQL = `
    WITH p AS (SELECT key AS tid, value AS w FROM json_each(?)),
    dot AS (
      SELECT st.strain_id AS sid, SUM(p.w / st.rang) AS d
      FROM p JOIN strain_terpene st ON st.terpen_id = p.tid
      GROUP BY st.strain_id
      HAVING d > 0
    )
    SELECT ${AROMA_SPALTEN}
    FROM dot
    JOIN strains s ON s.id = dot.sid AND s.aktiv = 1
    JOIN strain_terpene st ON st.strain_id = s.id
    LEFT JOIN sorten_kennwerte k ON k.strain_id = s.id AND k.anzahl > 0
    WHERE s.id NOT IN (SELECT value FROM json_each(?))
    GROUP BY s.id
    ORDER BY MAX(dot.d) * MAX(dot.d) / SUM(1.0 / (st.rang * st.rang)) DESC, s.id
    LIMIT ?`;

export const TERPENE_SQL = `SELECT id, name, geschmack FROM terpene ORDER BY id`;

export type TerpenZeile = { id: string; name: string; geschmack: string };
export type SortenAromaZeile = { sid: string; tp: string | null; gm: string | null };

function medianAus(roh: string | null): Werte | undefined {
  if (!roh) return undefined;
  try {
    const obj: unknown = JSON.parse(roh);
    if (!obj || typeof obj !== "object") return undefined;
    const aus: Werte = {};
    for (const [k, v] of Object.entries(obj)) if (typeof v === "number" && Number.isFinite(v)) aus[k] = v;
    return aus;
  } catch {
    return undefined;
  }
}

/** Zeilen aus `SORTEN_AROMA_SQL` und `TERPENE_SQL` zu Sorten; Unbekanntes entfällt. */
export function sortenAusZeilen(terpene: readonly TerpenZeile[], zeilen: readonly SortenAromaZeile[]): SortenAroma[] {
  const jeId = new Map<string, { name: string; geschmack: GeschmacksKategorie }>();
  for (const t of terpene) if (istGeschmacksKategorie(t.geschmack)) jeId.set(t.id, { name: t.name, geschmack: t.geschmack });
  const aus: SortenAroma[] = [];
  for (const z of zeilen) {
    const liste: { name: string; geschmack: GeschmacksKategorie; rang: number }[] = [];
    for (const teil of (z.tp ?? "").split(",")) {
      const trenner = teil.lastIndexOf(":");
      const terpen = jeId.get(teil.slice(0, trenner));
      const rang = Number(teil.slice(trenner + 1));
      if (terpen && Number.isFinite(rang)) liste.push({ name: terpen.name, geschmack: terpen.geschmack, rang });
    }
    if (liste.length === 0) continue;
    const geschmackMedian = medianAus(z.gm);
    aus.push(geschmackMedian ? { strainId: z.sid, terpene: liste, geschmackMedian } : { strainId: z.sid, terpene: liste });
  }
  return aus;
}

export type SqlAnweisung = { sql: string; params: (string | number)[] };

/**
 * Anweisungen, die die Liste eines Mitglieds ersetzen. Der Aufrufer führt sie
 * als eine D1-`batch` aus, die atomar läuft (Review T11: kein halber Stand).
 */
export function empfehlungenErsetzen(mitgliedId: string, liste: readonly Empfehlung[]): SqlAnweisung[] {
  return [
    { sql: `DELETE FROM nutzer_empfehlungen WHERE mitglied_id = ?`, params: [mitgliedId] },
    ...liste.map((e) => ({
      sql: `INSERT INTO nutzer_empfehlungen (mitglied_id, strain_id, rang, score, bezug_strain_id, gemeinsam) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [mitgliedId, e.strainId, e.rang, e.score, e.bezugStrainId, JSON.stringify(e.gemeinsam)],
    })),
  ];
}

/** Ab diesem Kosinus gilt eine Sorte als „ähnlich im Aroma“. */
export const AEHNLICH_MIN_KOSINUS = 0.5;

/** So lange gilt die vorberechnete Liste einer Sorte (Terpene ändern sich selten). */
export const AEHNLICH_GUELTIG_MS = 7 * 24 * 60 * 60 * 1000;

export function aehnlichVeraltet(berechnetAm: number | null | undefined, jetzt: number): boolean {
  return berechnetAm == null || jetzt - berechnetAm > AEHNLICH_GUELTIG_MS;
}

/**
 * „Ähnlich im Aroma“ für die Blütenseite, auch für Gäste (T11): Kosinus über
 * die Herstellerterpene (Gewicht 1/Rang), gerechnet in D1 statt im Worker.
 * Läuft nicht je Seitenaufruf, sondern höchstens einmal je Sorte und Woche;
 * das Ergebnis liegt in `sorten_aehnlich` (Review T11: D1-Lesekontingent).
 * Nur Treffer ab `AEHNLICH_MIN_KOSINUS`; verglichen wird der quadrierte
 * Kosinus (ohne SQRT). Parameter: zweimal die Id der Sorte.
 */
export const AEHNLICH_SQL = `
    WITH eigen AS (
      SELECT terpen_id, 1.0 / rang AS g FROM strain_terpene WHERE strain_id = ?
    ),
    treffer AS (
      SELECT b.strain_id AS sid, SUM(e.g / b.rang) AS skalar,
             GROUP_CONCAT(t.name, '|') AS gemeinsam
      FROM eigen e
      JOIN strain_terpene b ON b.terpen_id = e.terpen_id
      JOIN terpene t ON t.id = e.terpen_id
      WHERE b.strain_id <> ?
      GROUP BY b.strain_id
    ),
    bewertet AS (
      SELECT tr.sid, tr.gemeinsam,
             tr.skalar * tr.skalar
               / ((SELECT SUM(g * g) FROM eigen)
                  * (SELECT SUM(1.0 / (c.rang * c.rang)) FROM strain_terpene c WHERE c.strain_id = tr.sid)) AS kos2
      FROM treffer tr
    )
    SELECT s.slug AS slug, s.handelsname AS handelsname, bw.gemeinsam AS gemeinsam
    FROM bewertet bw
    JOIN strains s ON s.id = bw.sid AND s.aktiv = 1
    WHERE bw.kos2 >= ${AEHNLICH_MIN_KOSINUS * AEHNLICH_MIN_KOSINUS}
    ORDER BY bw.kos2 DESC, s.handelsname
    LIMIT 6`;
