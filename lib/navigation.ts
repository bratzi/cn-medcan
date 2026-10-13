/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1): die eigenen Bewertungen und
 * die Abstimmung vor Katalog und Apotheken. Seit 2026-10-13 (Nutzer) sind Profil
 * und Konto ein Knopf (PROFIL_LINK) und kein Menüpunkt mehr.
 */
export const HAUPTNAVIGATION = [
  { href: "/reviews", schluessel: "bewertungen" },
  { href: "/umfragen", schluessel: "abstimmung" },
  { href: "/blueten", schluessel: "blueten" },
  // Apotheken seit 2026-09-25 nur in Aussicht (Nutzer), deshalb nicht in der Navigation.
] as const;

/** Der eine Knopf rechts im Kopf; Text unter kopf.navigation.profil, angemeldet der Name. */
export const PROFIL_LINK = { href: "/profil", schluessel: "profil" } as const;

/** Nur die Seite selbst zählt: unter /profil/<kurz-id> stehen fremde öffentliche Profile. */
const OHNE_UNTERSEITEN: ReadonlySet<string> = new Set(["/profil"]);

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return pfad === href || (!OHNE_UNTERSEITEN.has(href) && pfad.startsWith(`${href}/`));
}
