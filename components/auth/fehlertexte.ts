/**
 * Better Auth antwortet englisch und mit Fehlercodes. Die Oberflaeche ist
 * deutsch, also wird hier uebersetzt - an einer Stelle, damit Anmeldung und
 * Registrierung dieselbe Sprache sprechen.
 *
 * Bewusst unscharf bei der Anmeldung: "E-Mail oder Passwort falsch" verraet
 * nicht, ob es die Adresse ueberhaupt gibt.
 */
const TEXTE: Record<string, string> = {
  USER_ALREADY_EXISTS: "Für diese E-Mail-Adresse besteht bereits ein Konto.",
  INVALID_EMAIL_OR_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch.",
  INVALID_EMAIL: "Diese E-Mail-Adresse ist nicht gültig.",
  INVALID_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch.",
  PASSWORD_TOO_SHORT: "Das Passwort ist zu kurz (mindestens 10 Zeichen).",
  PASSWORD_TOO_LONG: "Das Passwort ist zu lang.",
  USER_NOT_FOUND: "E-Mail-Adresse oder Passwort ist falsch.",
  FAILED_TO_CREATE_USER: "Das Konto konnte nicht angelegt werden.",
};

export function fehlertext(code: string | undefined, standard: string): string {
  if (code && TEXTE[code]) return TEXTE[code];
  return standard;
}
