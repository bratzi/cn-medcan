import type { Sprache } from "./sprache-kern";

/** Begleitstoffe haben im Englischen eigene Namen. */
const BEGLEITSTOFFE_EN: Record<string, string> = { Ester: "Esters", Thiole: "Thiols" };

/**
 * Anzeigename eines Terpens (Namen stehen deutsch in der Datenbank). Im
 * Englischen wird aus -en ein -ene (Myrcen -> Myrcene, Pinen -> Pinene);
 * Alkohole auf -ol heissen gleich. Ohne Liste, damit neue Terpene aus dem
 * Stamm ohne Nachtrag stimmen. Rein, also auch im Browser nutzbar.
 */
export function terpenAnzeige(name: string, sprache: Sprache): string {
  if (sprache === "de") return name;
  if (BEGLEITSTOFFE_EN[name]) return BEGLEITSTOFFE_EN[name];
  return /en$/.test(name) ? `${name}e` : name;
}
