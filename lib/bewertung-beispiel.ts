import type { BandEintrag } from "@/lib/query/buch-band";

/** Werte der Beispielblüte für die Sektion „Bewertung“ (Spec 2026-10-20, Teil A). */
export type BeispielWerte = {
  bluete: string;
  vertreiber: string | null;
  slug: string;
  /** Schnitt aus Aussehen, Geruch, Geschmack und Konsistenz, eine Nachkommastelle. */
  overall: number;
  /** Führendes Terpen laut Datenblatt; null ohne Terpene. */
  terpen: string | null;
  feuchte: number | null;
};

export function beispielWerte(eintrag: BandEintrag | null): BeispielWerte | null {
  if (!eintrag) return null;
  const { review: r, produkt: p } = eintrag;
  const overall = Math.round(((r.aussehen + r.geruch + r.geschmack + r.konsistenz) / 4) * 10) / 10;
  return { bluete: p.bluete, vertreiber: p.vertreiber, slug: p.slug, overall, terpen: p.terpene[0]?.name ?? null, feuchte: r.feuchtigkeitProzent };
}
