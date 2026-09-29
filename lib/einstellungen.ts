/**
 * Einstellungen der Schalterleiste unten rechts (T2, Nutzer 2026-09-29):
 * Zeiger und Sparmodus. Wie beim Thema (lib/thema.ts) stehen sie als
 * Attribute auf <html>, gesetzt vom Kopf-Skript vor dem ersten Zeichnen; die
 * Wahl liegt in localStorage. Wer sich ändert, meldet das per Ereignis, damit
 * JointCursor, StoryBuehne und loops.ts ohne gemeinsamen React-Zustand folgen.
 */

export type Zeiger = "standard" | "joint";

export const ZEIGER_SCHLUESSEL = "gruenes-buch-zeiger";
export const SPAR_SCHLUESSEL = "gruenes-buch-sparmodus";
/** Ereignis auf window nach jeder Änderung. */
export const EINSTELLUNG_EREIGNIS = "gruenes-buch-einstellung";

/** Gespeicherte Wahl gewinnt; ohne Wahl spart, wer den Datensparmodus an hat. */
export function sparVorgabe(gespeichert: string | null, saveData: boolean): boolean {
  if (gespeichert === "an") return true;
  if (gespeichert === "aus") return false;
  return saveData;
}

export function naechsterZeiger(zeiger: Zeiger): Zeiger {
  return zeiger === "joint" ? "standard" : "joint";
}

/** Läuft im <head> beim Parsen; ohne Speicher bleibt alles beim Standard. */
export const EINSTELLUNG_SKRIPT = `(function(){try{var d=document.documentElement,s=localStorage.getItem("${SPAR_SCHLUESSEL}"),n=navigator.connection;if(s==="an"||(s===null&&n&&n.saveData))d.setAttribute("data-sparmodus","");if(localStorage.getItem("${ZEIGER_SCHLUESSEL}")==="standard")d.setAttribute("data-zeiger","standard")}catch(e){}})()`;

function melden() {
  window.dispatchEvent(new Event(EINSTELLUNG_EREIGNIS));
}

export function istSparmodus(): boolean {
  return document.documentElement.hasAttribute("data-sparmodus");
}

export function setzeSparmodus(an: boolean) {
  document.documentElement.toggleAttribute("data-sparmodus", an);
  try {
    localStorage.setItem(SPAR_SCHLUESSEL, an ? "an" : "aus");
  } catch {}
  melden();
}

export function aktuellerZeiger(): Zeiger {
  return document.documentElement.dataset.zeiger === "standard" ? "standard" : "joint";
}

export function setzeZeiger(zeiger: Zeiger) {
  if (zeiger === "joint") delete document.documentElement.dataset.zeiger;
  else document.documentElement.dataset.zeiger = zeiger;
  try {
    localStorage.setItem(ZEIGER_SCHLUESSEL, zeiger);
  } catch {}
  melden();
}

/** Für useSyncExternalStore: meldet jede Änderung der Einstellungen. */
export function abonniereEinstellungen(rueckruf: () => void): () => void {
  window.addEventListener(EINSTELLUNG_EREIGNIS, rueckruf);
  return () => window.removeEventListener(EINSTELLUNG_EREIGNIS, rueckruf);
}
