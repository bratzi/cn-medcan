import { NextResponse, type NextRequest } from "next/server";
import { bewertenWeiterleitung } from "@/lib/alte-adressen";
import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";

/**
 * Sperrt die gesamte Seite hinter das Entwicklungs-Passwort.
 * Ausgenommen: die Login-Route selbst, Impressum und Datenschutzerklaerung
 * (muessen ohne Huerde erreichbar sein, § 5 DDG, Art. 13 DSGVO) und
 * statische Assets.
 *
 * Ohne gesetztes SITE_PASSWORD bleibt die Seite offen - so blockiert ein
 * fehlendes Secret nicht die lokale Entwicklung. In Produktion muss das
 * Secret gesetzt sein, siehe README.
 */
export async function proxy(request: NextRequest) {
  // Alte Bewertungsadresse, dauerhaft; vor dem Gate, das greift auf dem Ziel.
  const bewerten = bewertenWeiterleitung(request.nextUrl.pathname, request.nextUrl.search);
  if (bewerten) return NextResponse.redirect(new URL(bewerten, request.url), 308);

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
    // Alles ausser Login-Route, Impressum, Datenschutz, Next-Interna und
    // Dateien mit Endung. Das Muster muss ein Literal bleiben (Next liest es
    // statisch), deshalb stehen die Pfade hier und nicht aus lib/rechtliches.ts.
    //
    // Der Punkt MUSS als "\\." geschrieben werden. Ein einfaches "\." ist in
    // einem JS-String nur ".", das Muster waere dann ".*." und wuerde auf
    // jeden nicht leeren Pfad passen - die Negation haette also ALLES ausser
    // "/" vom Gate ausgenommen. Genau dieser Fehler war hier schon drin, und
    // er faellt nicht auf: die Seite funktioniert, sie ist nur offen.
    "/((?!zugang|api/zugang|api/sprache|impressum|datenschutz|_next/static|_next/image|favicon\\.ico|.*\\.).*)",
  ],
};
