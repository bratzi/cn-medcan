import { NextResponse, type NextRequest } from "next/server";

import { istSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { zielNachSprachwechsel } from "@/lib/i18n/sprachwechsel";

const EIN_JAHR_SEKUNDEN = 365 * 24 * 60 * 60;

/**
 * Ausdrückliche Sprachwahl (Spec Englisch 4.2). Seit 2026-10-01 ein Route
 * Handler statt einer Server Action (Spec statische Seiten, 4.1): Cookie
 * setzen, dann mit 303 zurück auf die Seite; der Proxy schreibt den nächsten
 * Aufruf mit der neuen Sprache um. Ohne Gate (lib/proxy-regeln.ts), weil der
 * Schalter auch auf /zugang und den Rechtsseiten steht. Geht ohne JavaScript.
 */
export async function POST(anfrage: NextRequest) {
  const daten = await anfrage.formData().catch(() => null);
  const wahl = daten?.get("sprache");
  const ziel = zielNachSprachwechsel(anfrage.headers.get("referer"), anfrage.nextUrl.origin);
  const antwort = NextResponse.redirect(new URL(ziel, anfrage.url), 303);
  if (istSprache(wahl)) {
    antwort.cookies.set(SPRACH_COOKIE, wahl, {
      path: "/",
      maxAge: EIN_JAHR_SEKUNDEN,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  }
  return antwort;
}
