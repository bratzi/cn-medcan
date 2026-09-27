import { getSessionCookie } from "better-auth/cookies";

/**
 * Traegt die Anfrage ein Better-Auth-Sitzungscookie? (Plan Caching v2, Schritt 3)
 *
 * Nur ein Vorfilter: ohne Cookie kann es keine Sitzung geben, also sparen sich
 * anonyme Besucher den Aufbau von Better Auth. Ob die Sitzung gilt, entscheidet
 * weiterhin getSession() - ein vorhandenes Cookie beweist nichts.
 */
export function hatSitzungsCookie(anfrageHeader: Headers): boolean {
  return getSessionCookie(anfrageHeader) !== null;
}
