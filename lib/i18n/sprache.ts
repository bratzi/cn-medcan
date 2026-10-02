import "server-only";

import { lang } from "next/root-params";

import { istSprache, type Sprache } from "./sprache-kern";

/**
 * Sprache der gerenderten Seite (Spec 2026-10-01, statische Seiten, 4.2): aus
 * dem internen Segment app/[lang], das der Proxy setzt. Server Components
 * lesen damit keine Anfrage mehr, und Seiten ohne Nutzerdaten können statisch
 * werden.
 *
 * Nicht in Server Actions und Route Handlern: dort wirft next/root-params. Die
 * nehmen holeSpracheAusAnfrage() aus lib/i18n/anfrage.ts.
 */
export async function holeSprache(): Promise<Sprache> {
  const wert = await lang();
  return istSprache(wert) ? wert : "de";
}
