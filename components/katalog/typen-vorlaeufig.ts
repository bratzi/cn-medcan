/**
 * Vorläufige Typen für Task 3 (Plan 2026-10-20 Blütenseite), solange Task 2 parallel läuft.
 * Wird beim Merge durch lib/katalog/filtern.ts und lib/query/filter.ts ersetzt.
 */
import type { StrainFilter as StrainFilterAlt } from "@/lib/query/filter";

export const NOTEN_STUFEN = [3, 3.5, 4, 4.5] as const;

export const SORTIERUNGEN = [
  "community", "stimmen", "neueste", "name", "thc_absteigend", "thc_aufsteigend", "preis_aufsteigend", "relevanz",
] as const;
export type Sortierung = (typeof SORTIERUNGEN)[number];

export type StrainFilter = Omit<StrainFilterAlt, "sortierung"> & {
  note?: number;
  bewertet: boolean;
  terp: string[];
  cbd: boolean;
  sortierung: Sortierung;
};

export type OptionsZahlen = {
  typ: Record<string, number>;
  form: Record<string, number>;
  geschmack: Record<string, number>;
  terp: Record<string, number>;
  vertreiber: Record<string, number>;
  note: Record<"3" | "3.5" | "4" | "4.5", number>;
  bewertet: number;
  cbd: number;
};
