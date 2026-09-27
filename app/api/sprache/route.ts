import { NextResponse, type NextRequest } from "next/server";

import { istSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";

/**
 * Test-Einstieg, solange der Umschalter verborgen ist (Plan Englisch,
 * Abweichung 5): /api/sprache?wahl=en setzt das Cookie und fuehrt auf die
 * Startseite. Kein frei waehlbares Ziel, also keine offene Weiterleitung.
 */
export function GET(request: NextRequest) {
  const wahl = request.nextUrl.searchParams.get("wahl");
  const antwort = NextResponse.redirect(new URL("/", request.url), 303);
  if (istSprache(wahl)) {
    antwort.cookies.set(SPRACH_COOKIE, wahl, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  }
  return antwort;
}
