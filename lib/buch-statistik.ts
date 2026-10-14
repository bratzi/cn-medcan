export type StatistikEintrag = { titel: string; href: string; wert: number };

export type BuchStatistik = {
  meistBewertet: StatistikEintrag[];
  best: StatistikEintrag[];
  niedrigst: StatistikEintrag[];
  bluetenKommentare: StatistikEintrag[];
  bewertungenKommentare: StatistikEintrag[];
  bewertungenLikes: StatistikEintrag[];
};

export const MIN_BEWERTUNGEN = 3;
export const STATISTIK_MAX = 5;

type NotenZeile = { titel: string; href: string; mittel: number | null; anzahl: number };

/** Best oder niedrigst bewertet: erst ab drei Bewertungen, höchstens fünf; Gleichstand nach Anzahl, dann Titel. */
export function ordneNoten(zeilen: readonly NotenZeile[], richtung: "best" | "niedrigst"): StatistikEintrag[] {
  const vorzeichen = richtung === "best" ? -1 : 1;
  return zeilen
    .filter((z): z is NotenZeile & { mittel: number } => z.anzahl >= MIN_BEWERTUNGEN && z.mittel !== null)
    .sort(
      (a, b) =>
        vorzeichen * (a.mittel - b.mittel) || b.anzahl - a.anzahl || a.titel.localeCompare(b.titel, "de"),
    )
    .slice(0, STATISTIK_MAX)
    .map((z) => ({ titel: z.titel, href: z.href, wert: Math.round(z.mittel * 10) / 10 }));
}
