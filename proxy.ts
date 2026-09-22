import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";

/**
 * Sperrt die gesamte Seite hinter das Entwicklungs-Passwort.
 * Ausgenommen: die Login-Route selbst und statische Assets.
 *
 * Ohne gesetztes SITE_PASSWORD bleibt die Seite offen - so blockiert ein
 * fehlendes Secret nicht die lokale Entwicklung. In Produktion muss das
 * Secret gesetzt sein, siehe README.
 */
export async function proxy(request: NextRequest) {
  const passwort = process.env.SITE_PASSWORD;
  const secret = process.env.SITE_SESSION_SECRET;

  if (!passwort || !secret) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (await tokenPruefen(secret, token)) return NextResponse.next();

  const ziel = new URL("/zugang", request.url);
  ziel.searchParams.set("weiter", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(ziel);
}

export const config = {
  matcher: [
    // Alles ausser Login-Route, Next-Interna und Dateien mit Endung.
    "/((?!zugang|api/zugang|_next/static|_next/image|favicon.ico|.*\.).*)",
  ],
};
