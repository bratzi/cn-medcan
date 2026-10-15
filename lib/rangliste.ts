/**
 * Ranglisten je Sorte (Spec Bewertungsbuch 5). Geordnet wird nach dem
 * Bayes-Mittel (C · m + Summe) / (C + n), angezeigt der echte Schnitt: so
 * schlägt eine einzelne 5,0 nicht viele gute Bewertungen (Muster Untappd).
 */
export const RANGLISTEN = ["hoechste", "niedrigste", "meiste", "neueste", "uneins"] as const;
export type Rangliste = (typeof RANGLISTEN)[number];
export const KARTEN_JE_SEITE = 12;
export const BAYES_C = 3;

export type SortenZeile = {
  strainId: string;
  anzahl: number;
  summe: number;
  betreiber: number | null;
  communityAnzahl: number;
  communitySumme: number;
  zuletzt: string;
  /** Sorte (Kultivar) des Produkts; Zeilen mit gleicher Sorte zählt `fasseJeKultivar` zusammen. */
  kultivarId?: string | null;
  /** Zeitpunkt der Betreiber-Note, damit beim Zusammenfassen die neueste gilt. */
  betreiberAm?: string | null;
};
export type Platz = SortenZeile & { rang: number; schnitt: number; gewichtet: number; abstand: number | null };

export function parameter(nach: string | null, seite: string | null): { nach: Rangliste; seite: number } {
  const n = (RANGLISTEN as readonly string[]).includes(nach ?? "") ? (nach as Rangliste) : "hoechste";
  const s = seite && /^\d+$/.test(seite) && Number(seite) >= 1 ? Number(seite) : 1;
  return { nach: n, seite: s };
}

/**
 * Fasst Zeilen je Produkt zu einer Zeile je Sorte zusammen (Spec Sorte im Fokus 3): Anzahl und Summen
 * addieren sich, die Betreiber-Note ist die neueste. `strainId` bleibt die des zahlenstärksten Produkts,
 * damit die Karte ein Bild findet; Zeilen ohne Sorte bleiben einzeln.
 */
export function fasseJeKultivar(zeilen: readonly SortenZeile[]): SortenZeile[] {
  const gruppen = new Map<string, SortenZeile[]>();
  for (const z of zeilen) {
    const schluessel = z.kultivarId ? `k:${z.kultivarId}` : `s:${z.strainId}`;
    gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), z]);
  }
  return [...gruppen.values()].map((g) => {
    if (g.length === 1) return g[0];
    const haupt = [...g].sort((a, b) => b.anzahl - a.anzahl || a.strainId.localeCompare(b.strainId))[0];
    const betreiber = g
      .filter((z) => z.betreiber !== null)
      .sort((a, b) => (b.betreiberAm ?? "").localeCompare(a.betreiberAm ?? "") || a.strainId.localeCompare(b.strainId))[0];
    return {
      strainId: haupt.strainId,
      kultivarId: haupt.kultivarId,
      anzahl: g.reduce((a, z) => a + z.anzahl, 0),
      summe: g.reduce((a, z) => a + z.summe, 0),
      betreiber: betreiber?.betreiber ?? null,
      betreiberAm: betreiber?.betreiberAm ?? null,
      communityAnzahl: g.reduce((a, z) => a + z.communityAnzahl, 0),
      communitySumme: g.reduce((a, z) => a + z.communitySumme, 0),
      zuletzt: g.reduce((a, z) => (z.zuletzt > a ? z.zuletzt : a), ""),
    };
  });
}

export function ordne(zeilen: readonly SortenZeile[], nach: Rangliste): Platz[] {
  const mit = zeilen.filter((z) => z.anzahl > 0);
  const n = mit.reduce((a, z) => a + z.anzahl, 0);
  const m = n === 0 ? 0 : mit.reduce((a, z) => a + z.summe, 0) / n;
  let plaetze = mit.map((z) => ({
    ...z,
    rang: 0,
    schnitt: z.summe / z.anzahl,
    gewichtet: (BAYES_C * m + z.summe) / (BAYES_C + z.anzahl),
    abstand: z.betreiber !== null && z.communityAnzahl > 0 ? Math.abs(z.betreiber - z.communitySumme / z.communityAnzahl) : null,
  }));
  const name = (a: Platz, b: Platz) => a.strainId.localeCompare(b.strainId);
  if (nach === "uneins") plaetze = plaetze.filter((p) => p.abstand !== null);
  const ordnung: Record<Rangliste, (a: Platz, b: Platz) => number> = {
    hoechste: (a, b) => b.gewichtet - a.gewichtet || b.anzahl - a.anzahl || name(a, b),
    niedrigste: (a, b) => a.gewichtet - b.gewichtet || b.anzahl - a.anzahl || name(a, b),
    meiste: (a, b) => b.anzahl - a.anzahl || b.schnitt - a.schnitt || name(a, b),
    neueste: (a, b) => b.zuletzt.localeCompare(a.zuletzt) || name(a, b),
    uneins: (a, b) => (b.abstand ?? 0) - (a.abstand ?? 0) || name(a, b),
  };
  return plaetze.sort(ordnung[nach]).map((p, i) => ({ ...p, rang: i + 1 }));
}

export function seiteVon(plaetze: readonly Platz[], seite: number): { plaetze: Platz[]; seiten: number } {
  const seiten = Math.max(1, Math.ceil(plaetze.length / KARTEN_JE_SEITE));
  return { plaetze: plaetze.slice((seite - 1) * KARTEN_JE_SEITE, seite * KARTEN_JE_SEITE), seiten };
}

/** Seite auf 1 bis letzte Seite begrenzen: ein alter Hash darf nie ins Leere führen. */
export function begrenzeSeite(plaetze: readonly Platz[], seite: number): number {
  return Math.min(Math.max(1, seite), seiteVon(plaetze, 1).seiten);
}
