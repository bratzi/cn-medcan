import type { Sprache } from "./sprache-kern";

/** Begleitstoffe und Terpene, deren englische Schreibung nicht der Regel folgt. */
const AUSNAHMEN_EN: Record<string, string> = {
  Ester: "Esters",
  Thiole: "Thiols",
  Guajol: "Guaiol",
  Eukalyptol: "Eucalyptol",
};

/**
 * Anzeigename eines Terpens (Namen stehen deutsch in der Datenbank). Im
 * Englischen wird aus -en ein -ene (Myrcen -> Myrcene, Pinen -> Pinene);
 * Alkohole auf -ol heissen gleich. Ohne Liste, damit neue Terpene aus dem
 * Stamm ohne Nachtrag stimmen; Ausnahmen oben. Rein, also auch im Browser nutzbar.
 */
export function terpenAnzeige(name: string, sprache: Sprache): string {
  if (sprache === "de") return name;
  if (AUSNAHMEN_EN[name]) return AUSNAHMEN_EN[name];
  return /en$/.test(name) ? `${name}e` : name;
}
