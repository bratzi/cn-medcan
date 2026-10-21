import { SORTIERUNGEN, leererFilter, type Sortierung, type StrainFilter } from "@/lib/query/filter";

/** Chips der Werkzeugleiste (Spec 2026-10-21), Reihenfolge = Anzeige. */
export const CHIPS = ["community", "terpene", "geschmack", "typ", "thc", "vertreiber", "form", "verfuegbar", "mehr"] as const;
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
    case "vertreiber":
      return f.vertreiber.length;
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
