import { SORTIERUNGEN, aktiveRichtung, leererFilter, type Sortierung, type StrainFilter } from "@/lib/query/filter";

/** Chips der Werkzeugleiste (Spec 2026-10-21), Reihenfolge = Anzeige. */
export const CHIPS = ["community", "terpene", "geschmack", "typ", "thc", "form", "verfuegbar", "mehr"] as const;
export type ChipSchluessel = (typeof CHIPS)[number];

/** Sortierungen, die ab lg direkt als Segment stehen. */
export const SORTIER_SEGMENT = ["community", "stimmen", "neueste", "thc_absteigend"] as const satisfies readonly Sortierung[];
/** Rest im „…“-Menü, in der Reihenfolge von SORTIERUNGEN. */
export const SORTIER_MEHR: readonly Sortierung[] = SORTIERUNGEN.filter(
  (s) => !(SORTIER_SEGMENT as readonly string[]).includes(s),
);

/** Zahl aktiver Werte am Chip; 0 heißt: kein Zähler. */
export function chipZahl(f: StrainFilter, chip: ChipSchluessel): number {
  const leer = leererFilter();
  switch (chip) {
    case "community":
      return (f.note !== undefined ? 1 : 0) + (f.bewertet ? 1 : 0);
    case "terpene":
      return f.terp.length;
    case "geschmack":
      return f.geschmack.length;
    case "typ":
      return f.typ.length;
    case "thc":
      return (f.thcMin !== leer.thcMin || f.thcMax !== leer.thcMax ? 1 : 0) + (f.cbd ? 1 : 0);
    case "form":
      return f.form.length;
    case "verfuegbar":
      return f.nurVerfuegbar ? 1 : 0;
    case "mehr":
      return f.apotheke.length + (f.preisMax !== undefined ? 1 : 0);
  }
}

/** Chip „Mehr“ trägt nur Fachkreis-Felder; ohne Fachkreis entfällt er. */
export function sichtbareChips(fachkreis: boolean): ChipSchluessel[] {
  return CHIPS.filter((c) => fachkreis || c !== "mehr");
}

/**
 * URL-Teil für einen neuen Suchtext (Spec 2026-10-21: bei Suchtext ist Relevanz Standard). Erster
 * Suchtext springt vom Standard auf `relevanz`; geleert fällt `relevanz` auf den Standard zurück.
 * Eine bewusst gewählte andere Sortierung bleibt stehen.
 */
export function suchTeil(alt: StrainFilter, roh: string): Partial<StrainFilter> {
  const q = roh.trim() === "" ? undefined : roh.trim();
  const standard = leererFilter().sortierung;
  const teil: Partial<StrainFilter> = { q, seite: 1 };
  if (q && !alt.q && alt.sortierung === standard) teil.sortierung = "relevanz";
  if (!q && alt.sortierung === "relevanz") teil.sortierung = standard;
  if (teil.sortierung) teil.richtung = undefined;
  return teil;
}

/**
 * URL-Teil für einen Klick auf eine Sortierung (Spec 2026-10-21, 4): die aktive ein zweites Mal
 * gewählt dreht die Richtung, eine andere startet in ihrer Standardrichtung.
 */
export function naechsteSortierung(alt: StrainFilter, s: Sortierung): Pick<StrainFilter, "sortierung" | "richtung" | "seite"> {
  if (alt.sortierung !== s) return { sortierung: s, richtung: undefined, seite: 1 };
  return { sortierung: s, richtung: aktiveRichtung(alt) === "ab" ? "auf" : "ab", seite: 1 };
}
