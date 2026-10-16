import { hwgTreffer } from "@/lib/hwg-filter";

export const JURY_BILDER_MAX = 5;
export const JURY_BILD_MAX_BYTES = 300 * 1024;
export const JURY_BILD_MAX_KANTE = 1600;
export const TITEL_MAX = 90;
export const ANRISS_MAX = 200;
export const TEXT_MAX = 12000;

export type BeitragEingabe = { titel: string; anriss: string; text: string; reviewId: string | null };

/** Prüft einen Jury-Beitrag (Spec 2026-10-16, HWG redaktionell). Leeres Ergebnis = gültig. */
export function beitragPruefen(e: BeitragEingabe): string[] {
  const f: string[] = [];
  const titel = e.titel.trim();
  if (!titel) f.push("titel.leer");
  if (titel.length > TITEL_MAX) f.push("titel.lang");
  if (e.anriss.trim().length > ANRISS_MAX) f.push("anriss.lang");
  if (!e.text.trim()) f.push("text.leer");
  if (e.text.length > TEXT_MAX) f.push("text.lang");
  if (hwgTreffer([titel, e.anriss, e.text].join(" "))) f.push("hwg");
  return f;
}

/** Feste Pfade unter /jury: ein Beitrags-Slug darf ihnen nicht gleichen. */
const RESERVIERT: ReadonlySet<string> = new Set(["team", "favourites", "seite", "ausgabe"]);

/** Slug ohne Kollisionsprüfung; auch das Präfix für die Suche nach belegten Slugs. */
export function juryslugBasis(titel: string): string {
  return (
    titel
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "beitrag"
  );
}

export function juryslug(titel: string, vorhanden: (s: string) => boolean): string {
  const basis = juryslugBasis(titel);
  const belegt = (s: string) => RESERVIERT.has(s) || vorhanden(s);
  if (!belegt(basis)) return basis;
  for (let n = 2; ; n++) if (!belegt(`${basis}-${n}`)) return `${basis}-${n}`;
}

/** Öffentlich nur, wenn der Beitrag und seine Ausgabe (falls vorhanden) veröffentlicht sind. */
export function sichtbar(b: { status: string; ausgabe: { status: string } | null }): boolean {
  return b.status === "VEROEFFENTLICHT" && (!b.ausgabe || b.ausgabe.status === "VEROEFFENTLICHT");
}

/** Höchstzahl der Sorten-Ids je `in`-Abfrage der Favourites. */
export const FAVOURITEN_SORTEN_MAX = 50;

/**
 * Sorten für die Jury-Bewertungen der Favourites: zuerst die aus sichtbaren Jury-Beiträgen, dann die Gewinner
 * beendeter Abstimmungen; ohne Doppel, höchstens FAVOURITEN_SORTEN_MAX.
 */
export function favouritenSortenIds(beitragSorten: readonly (string | null)[], umfrageSorten: readonly string[]): string[] {
  const ids = new Set<string>();
  for (const id of [...beitragSorten, ...umfrageSorten]) {
    if (ids.size >= FAVOURITEN_SORTEN_MAX) break;
    if (id) ids.add(id);
  }
  return [...ids];
}
