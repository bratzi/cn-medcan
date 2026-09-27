import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import { I18N_OEFFENTLICH } from "./schalter";
import { bestimmeSprache, SPRACH_COOKIE, type Sprache } from "./sprache-kern";

/** Einmal je Anfrage (React cache). cookies()/headers() machen die Route dynamisch. */
export const holeSprache = cache(async (): Promise<Sprache> => {
  const [cookieSpeicher, anfrageHeader] = await Promise.all([cookies(), headers()]);
  return bestimmeSprache({
    cookie: cookieSpeicher.get(SPRACH_COOKIE)?.value,
    acceptLanguage: anfrageHeader.get("accept-language"),
    erkennungAktiv: I18N_OEFFENTLICH,
  });
});
