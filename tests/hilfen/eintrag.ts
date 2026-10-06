import type { EintragDaten } from "@/components/review/eintrag";

export const MATRIX = { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2, fruchtig: 0, minzig: 0 };

/** Eine Bewertung für die Tests der Doppelseiten; einzelne Felder lassen sich überschreiben. */
export function eintrag(teil: Partial<EintragDaten> = {}): EintragDaten {
  return {
    id: "r1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    aussehen: 4,
    geruch: 5,
    geschmack: 5,
    wirkung: 4.5,
    konsistenz: 2.5,
    geschmacksMatrix: MATRIX,
    feuchtigkeitProzent: 11.2,
    notiz: "Sehr dichte Blüten.",
    instagramReelUrl: null,
    chargenNr: "CH-2401",
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
    istBetreiber: true,
    autorName: "Waldi",
    autorBewertungen: 7,
    gesamtnote: 3.5,
    terpene: [],
    terpenIntensitaet: {},
    beschaffenheit: {},
    ...teil,
  };
}
