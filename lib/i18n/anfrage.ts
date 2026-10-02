import "server-only";

import { cookies, headers } from "next/headers";

import { I18N_OEFFENTLICH } from "./schalter";
import { bestimmeSprache, SPRACH_COOKIE, type Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";
import { WOERTERBUECHER } from "./woerterbuecher";

/**
 * Sprache einer Server Action oder eines Route Handlers (Spec 2026-10-01,
 * statische Seiten, 4.2). next/root-params wirft dort; deshalb dieselbe Regel
 * wie der Proxy, der die Seite umgeschrieben hat: Cookie, sonst
 * Accept-Language, sonst Deutsch. Server Components nehmen holeSprache().
 */
export async function holeSpracheAusAnfrage(): Promise<Sprache> {
  const [cookieSpeicher, anfrageHeader] = await Promise.all([cookies(), headers()]);
  return bestimmeSprache({
    cookie: cookieSpeicher.get(SPRACH_COOKIE)?.value,
    acceptLanguage: anfrageHeader.get("accept-language"),
    erkennungAktiv: I18N_OEFFENTLICH,
  });
}

export async function holeWoerterbuchAusAnfrage(): Promise<Woerterbuch> {
  return WOERTERBUECHER[await holeSpracheAusAnfrage()];
}
