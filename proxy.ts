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
  if ((await tokenPruefen(secret, token)) !== null) return NextResponse.next();

  const ziel = new URL("/zugang", request.url);
  ziel.searchParams.set("weiter", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(ziel);
}

export const config = {
  matcher: [
    // Alles ausser Login-Route, Next-Interna und Dateien mit Endung.
    //
    // Der Punkt MUSS als "\\." geschrieben werden. Ein einfaches "\." ist in
    // einem JS-String nur ".", das Muster waere dann ".*." und wuerde auf
    // jeden nicht leeren Pfad passen - die Negation haette also ALLES ausser
    // "/" vom Gate ausgenommen. Genau dieser Fehler war hier schon drin, und
    // er faellt nicht auf: die Seite funktioniert, sie ist nur offen.
    "/((?!zugang|api/zugang|_next/static|_next/image|favicon\\.ico|.*\\.).*)",
  ],
};
