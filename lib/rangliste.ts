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
};
export type Platz = SortenZeile & { rang: number; schnitt: number; gewichtet: number; abstand: number | null };

export function parameter(nach: string | null, seite: string | null): { nach: Rangliste; seite: number } {
  const n = (RANGLISTEN as readonly string[]).includes(nach ?? "") ? (nach as Rangliste) : "hoechste";
  const s = seite && /^\d+$/.test(seite) && Number(seite) >= 1 ? Number(seite) : 1;
  return { nach: n, seite: s };
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
