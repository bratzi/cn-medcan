/**
 * Budpics (T9, Nutzer 2026-09-29): Bluetenbilder von Mitgliedern. Reine
 * Helfer ohne Abhaengigkeiten, damit Server und Browser sie teilen.
 *
 * Bilder liegen als BLOB in D1 (kein R2, nie kostenpflichtig): hoechstens
 * 150 KB und 1280 px je Bild. Ein BLOB ist ein einzelner gebundener Parameter
 * und die Zeile bleibt weit unter dem D1-Limit von 2 MB.
 */

export const BUDPIC_MAX_BYTES = 150 * 1024;
export const BUDPIC_MAX_KANTE = 1280;
/** Dateien je Auswahl; jede geht als eigener Aufruf raus (kleine Anfragen). */
export const BUDPIC_MAX_DATEIEN = 5;
/** Offene Bilder je Mitglied: schuetzt die Datenbank vor Uebervoll und die Pruefung vor Flut. */
export const BUDPIC_MAX_OFFEN = 10;
/** Freigegebene Bilder, die eine Sorte zeigt (neueste zuerst). */
export const BUDPIC_MAX_ANZEIGE = 8;

/** Bilder je Bewertung (Spec 2026-10-06, Nutzer): offene und freigegebene zaehlen, abgelehnte nicht. */
export const BEWERTUNGSBILD_MAX = 3;
/** Zeit je Bild in der Diashow. */
export const BUDPIC_WECHSEL_MS = 5000;

export const BUDPIC_STATUS = ["OFFEN", "FREIGEGEBEN", "ABGELEHNT"] as const;
export type BudpicStatus = (typeof BUDPIC_STATUS)[number];

/** Die Musterbilder: alle Fotos bluete-01 bis bluete-10 aus lib/medien.ts. */
export const MUSTER_ANZAHL = 10;

/** Einfacher, stabiler Streuwert (FNV-1a, 32 Bit) ueber die Zeichen des Slugs. */
export function slugHash(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Medien-Id des Musterbilds einer Sorte: zufaellig wirkend, aber je Slug immer dasselbe. */
export function musterBildId(slug: string): string {
  const nr = (slugHash(slug) % MUSTER_ANZAHL) + 1;
  return `bluete-${String(nr).padStart(2, "0")}`;
}

/** Zielmasse: die lange Kante hoechstens `max`, das Seitenverhaeltnis bleibt, nie hochskalieren. */
export function skalierteMasse(breite: number, hoehe: number, max: number = BUDPIC_MAX_KANTE): { breite: number; hoehe: number } {
  const lang = Math.max(breite, hoehe);
  if (lang <= max) return { breite, hoehe };
  const faktor = max / lang;
  return { breite: Math.max(1, Math.round(breite * faktor)), hoehe: Math.max(1, Math.round(hoehe * faktor)) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function istBudpicId(wert: unknown): wert is string {
  return typeof wert === "string" && UUID.test(wert);
}

/** Gehört das Bild zu einer Bewertung (Spec 2026-10-06)? Für den Vermerk in /admin. */
export function budpicAusBewertung(reviewId: string | null): boolean {
  return reviewId !== null;
}
