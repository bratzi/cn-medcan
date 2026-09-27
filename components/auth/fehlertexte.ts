import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Better Auth antwortet englisch und mit Fehlercodes. Die Texte je Code
 * stehen im Woerterbuch (auth.fehler); hier wird nachgeschlagen - an einer
 * Stelle, damit Anmeldung und Registrierung dieselbe Sprache sprechen.
 *
 * Bewusst unscharf bei der Anmeldung: "E-Mail oder Passwort falsch" verraet
 * nicht, ob es die Adresse ueberhaupt gibt.
 */
type Fehlertexte = Woerterbuch["auth"]["fehler"];

function istBekannt(texte: Fehlertexte, code: string): code is keyof Fehlertexte {
  return Object.hasOwn(texte, code);
}

export function fehlertext(texte: Fehlertexte, code: string | undefined, standard: string): string {
  if (code && istBekannt(texte, code)) return texte[code];
  return standard;
}
