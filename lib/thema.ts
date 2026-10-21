/**
 * Hell und Dunkel (Session 13): seit 2026-10-21 (Nutzer) startet die Seite dunkel,
 * Hell wählt man per Schalter im Kopf. Die Wahl liegt in localStorage; das
 * Skript läuft im <head> beim Parsen, vor dem ersten Zeichnen und vor
 * React (Next-Doku "Preventing flash before hydration").
 */
export type Thema = "light" | "dark";

export const THEMA_STANDARD: Thema = "dark";
export const THEMA_SCHLUESSEL = "gruenes-buch-thema";

export function anderesThema(thema: Thema): Thema {
  return thema === "dark" ? "light" : "dark";
}

/** Ohne Speicher (privates Fenster, gesperrt) bleibt es einfach dunkel. */
export const THEMA_SKRIPT = `(function(){try{if(localStorage.getItem("${THEMA_SCHLUESSEL}")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`;
