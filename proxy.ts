import { NextResponse, type NextRequest } from "next/server";

import { bewertenWeiterleitung } from "@/lib/alte-adressen";
import { SPRACH_ERKENNUNG } from "@/lib/i18n/schalter";
import { bestimmeSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { internerPfad, istApiPfad } from "@/lib/proxy-regeln";

/**
 * Vor jeder Seite (Spec 2026-10-01, statische Seiten, 4.1):
 *
 * - Alte Adressen dauerhaft umleiten (/bewerten, /zugang).
 * - Die Sprache als internes Pfadsegment: /x wird zu /de/x oder /en/x
 *    umgeschrieben (Rewrite, die URL im Browser bleibt). So legt Next jede
 *    Seite je Sprache getrennt ab, ohne dass das Layout Cookies liest.
 *
 * Die Passwortschranke ist seit 2026-10-22 weg (Nutzer): die Seite ist öffentlich, wer schreiben will,
 * registriert sich und wird in /admin freigegeben (lib/session.ts). Schnittstellen für Skripte prüfen
 * ihren Schlüssel selbst (lib/ig-schluessel.ts).
 *
 * Gecachte Seiten laufen trotzdem hier durch: OpenNext ruft den Proxy vor der
 * Cache-Interception auf (core/routingHandler.js).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Alte Bewertungsadresse, dauerhaft.
  const bewerten = bewertenWeiterleitung(pathname, search);
  if (bewerten) return NextResponse.redirect(new URL(bewerten, request.url), 308);
  // Die Kennwortseite gibt es nicht mehr; alte Lesezeichen landen auf der Startseite.
  if (pathname === "/zugang" || pathname === "/api/zugang") return NextResponse.redirect(new URL("/", request.url), 308);

  if (istApiPfad(pathname)) return NextResponse.next();

  const sprache = bestimmeSprache({
    cookie: request.cookies.get(SPRACH_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    erkennungAktiv: SPRACH_ERKENNUNG,
  });
  const intern = request.nextUrl.clone();
  intern.pathname = internerPfad(sprache, pathname);
  return NextResponse.rewrite(intern);
}

export const config = {
  matcher: [
    // Alles ausser Next-Interna und den Icons aus app/. Seit 2026-10-01 laufen
    // auch Impressum, Datenschutz, /zugang und Pfade mit Punkt hier durch: die
    // Seiten brauchen das Sprach-Rewrite, und Scanner-Pfade wie /wp-login.php
    // sollen am Gate enden statt einen Cache-Eintrag anzulegen. Echte Dateien aus
    // public/ liefert Cloudflare vor dem Worker aus; sie erreichen den Proxy nie.
    //
    // Das Muster muss ein Literal bleiben (Next liest es statisch). Ein Punkt
    // MUSS als doppelter Backslash plus Punkt stehen; ein einfacher Backslash
    // ist im JS-String nur ein Punkt, und das Muster passte auf mehr als gemeint.
    "/((?!_next/|favicon\\.ico|icon\\.png|apple-icon\\.png).*)",
  ],
};
