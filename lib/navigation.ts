/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1): die eigenen Bewertungen und
 * die Abstimmung vor Katalog und Apotheken. "Mein Profil" steht getrennt,
 * weil es kein Inhalt ist.
 */
export const HAUPTNAVIGATION = [
  { href: "/reviews", schluessel: "bewertungen" },
  { href: "/umfragen", schluessel: "abstimmung" },
  { href: "/blueten", schluessel: "blueten" },
  // Apotheken seit 2026-09-25 nur in Aussicht (Nutzer), deshalb nicht in der Navigation.
] as const;

/** Texte im Woerterbuch unter kopf.navigation[schluessel]. Konto ist seit Spec Profil 6 ein Reiter des Profils. */
export const KONTO_LINK = { href: "/profil", schluessel: "konto" } as const;

/** Pfade, die zusätzlich als „hier“ zählen: /mitglied ist der Reiter Konto von /profil. */
const AUCH_AKTIV: Record<string, readonly string[]> = { "/profil": ["/mitglied"] };

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return [href, ...(AUCH_AKTIV[href] ?? [])].some((h) => pfad === h || pfad.startsWith(`${h}/`));
}
