/**
 * Filterspalte der Blütenseite (Task 2, 2026-10-20): ab lg ein- und ausblendbar. Ohne Wahl ist sie ab
 * 2xl (1536 px) offen, darunter zu. Die Wahl liegt in localStorage und steht wie Thema und
 * Einstellungen (lib/thema.ts, lib/einstellungen.ts) als Attribut an <html>, gesetzt vom Kopf-Skript
 * vor dem ersten Zeichnen. Sichtbar macht die Spalte allein CSS (`.katalog-filterspalte` in
 * globals.css): kein Springen vor der Hydration, kein Unterschied zwischen Server und Browser.
 */

export const FILTER_SCHLUESSEL = "bt-katalog-filter";
export const FILTER_ATTRIBUT = "data-katalog-filter";
/** Ab hier ist die Spalte ohne Wahl offen; dieselbe Grenze steht in globals.css (Tailwind 2xl). */
export const FILTER_STANDARD_OFFEN_AB = "(min-width: 96rem)";
/** Ereignis auf window nach jeder Änderung, für useSyncExternalStore. */
const FILTER_EREIGNIS = "bt-katalog-filter";

export type FilterWahl = "offen" | "zu";

/** Nur „offen“ und „zu“ zählen; alles andere heißt: keine Wahl, es gilt der Standard. */
export function alsFilterWahl(roh: unknown): FilterWahl | null {
  return roh === "offen" || roh === "zu" ? roh : null;
}

/** Ohne Wahl entscheidet die Breite (offen ab 2xl), sonst die Wahl des Besuchers. */
export function filterIstOffen(wahl: FilterWahl | null, breit: boolean): boolean {
  return wahl === null ? breit : wahl === "offen";
}

/** Läuft im <head> beim Parsen; ohne Speicher (gesperrt, privat) bleibt der Standard aus dem CSS. */
export const FILTER_SKRIPT = `(function(){try{var w=localStorage.getItem("${FILTER_SCHLUESSEL}");if(w==="offen"||w==="zu")document.documentElement.setAttribute("${FILTER_ATTRIBUT}",w)}catch(e){}})()`;

export function gespeicherteFilterWahl(): FilterWahl | null {
  try { return alsFilterWahl(localStorage.getItem(FILTER_SCHLUESSEL)); } catch { return null; }
}

/** Attribut an <html> nach der Wahl (oder ohne), dann melden. CSS folgt dem Attribut. */
export function zeigeFilterWahl(wahl: FilterWahl | null): void {
  const html = document.documentElement;
  if (wahl) html.setAttribute(FILTER_ATTRIBUT, wahl);
  else html.removeAttribute(FILTER_ATTRIBUT);
  window.dispatchEvent(new Event(FILTER_EREIGNIS));
}

/** Klick auf „Filter“: Wahl merken (wenn der Speicher es zulässt) und sofort zeigen. */
export function setzeFilterWahl(wahl: FilterWahl): void {
  try { localStorage.setItem(FILTER_SCHLUESSEL, wahl); } catch {}
  zeigeFilterWahl(wahl);
}

let breitAnfrage: MediaQueryList | null = null;
function breit(): MediaQueryList {
  breitAnfrage ??= window.matchMedia(FILTER_STANDARD_OFFEN_AB);
  return breitAnfrage;
}

/** Für useSyncExternalStore: der wirksame Zustand aus Attribut und Breite. */
export function filterSpalteOffen(): boolean {
  return filterIstOffen(alsFilterWahl(document.documentElement.getAttribute(FILTER_ATTRIBUT)), breit().matches);
}

/** Für useSyncExternalStore: meldet Umschalten und das Überschreiten der 2xl-Grenze. */
export function abonniereFilterSpalte(rueckruf: () => void): () => void {
  const anfrage = breit();
  window.addEventListener(FILTER_EREIGNIS, rueckruf);
  anfrage.addEventListener("change", rueckruf);
  return () => {
    window.removeEventListener(FILTER_EREIGNIS, rueckruf);
    anfrage.removeEventListener("change", rueckruf);
  };
}
