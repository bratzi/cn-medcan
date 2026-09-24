/**
 * Hell und Dunkel (Session 13): die Seite startet hell auf Papier, Dunkel
 * wählt man per Schalter im Kopf. Die Wahl liegt in localStorage; das
 * Skript läuft im <head> beim Parsen, vor dem ersten Zeichnen und vor
 * React (Next-Doku "Preventing flash before hydration").
 */
export type Thema = "light" | "dark";

export const THEMA_STANDARD: Thema = "light";
export const THEMA_SCHLUESSEL = "gruenes-buch-thema";

export function anderesThema(thema: Thema): Thema {
  return thema === "dark" ? "light" : "dark";
}

/** Ohne Speicher (privates Fenster, gesperrt) bleibt es einfach hell. */
export const THEMA_SKRIPT = `(function(){try{if(localStorage.getItem("${THEMA_SCHLUESSEL}")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;
