/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1): die eigenen Bewertungen und
 * die Abstimmung vor Katalog und Apotheken. "Mein Konto" steht getrennt,
 * weil es kein Inhalt ist.
 */
export const HAUPTNAVIGATION = [
  { href: "/reviews", schluessel: "bewertungen" },
  { href: "/umfragen", schluessel: "abstimmung" },
  { href: "/blueten", schluessel: "blueten" },
  // Apotheken seit 2026-09-25 nur in Aussicht (Nutzer), deshalb nicht in der Navigation.
] as const;

/** Texte im Woerterbuch unter kopf.navigation[schluessel]. */
export const KONTO_LINK = { href: "/mitglied", schluessel: "konto" } as const;

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return pfad === href || pfad.startsWith(`${href}/`);
}
