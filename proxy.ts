import { NextResponse, type NextRequest } from "next/server";

import { bewertenWeiterleitung } from "@/lib/alte-adressen";
import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";
import { I18N_OEFFENTLICH } from "@/lib/i18n/schalter";
import { bestimmeSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { internerPfad, istApiPfad, istOhneGate } from "@/lib/proxy-regeln";

/**
 * Zwei Aufgaben vor jeder Seite (Spec 2026-10-01, statische Seiten, 4.1):
 *
 * 1. Das Entwicklungs-Passwort. Ausgenommen sind Login, Impressum, Datenschutz
 *    (ohne Hürde erreichbar, § 5 DDG, Art. 13 DSGVO) und der Sprachwechsel,
 *    siehe lib/proxy-regeln.ts. Ohne gesetztes SITE_PASSWORD bleibt die Seite
 *    offen, damit ein fehlendes Secret nicht die lokale Entwicklung blockiert.
 *    In Produktion muss das Secret gesetzt sein, siehe README.
 * 2. Die Sprache als internes Pfadsegment: /x wird zu /de/x oder /en/x
 *    umgeschrieben (Rewrite, die URL im Browser bleibt). So legt Next jede
 *    Seite je Sprache getrennt ab, ohne dass das Layout Cookies liest.
 *
 * Gecachte Seiten laufen trotzdem hier durch: OpenNext ruft den Proxy vor der
 * Cache-Interception auf (core/routingHandler.js).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Alte Bewertungsadresse, dauerhaft; vor dem Gate, das greift auf dem Ziel.
  const bewerten = bewertenWeiterleitung(pathname, search);
  if (bewerten) return NextResponse.redirect(new URL(bewerten, request.url), 308);

  if (!istOhneGate(pathname) && !(await gateOffen(request))) {
    const ziel = new URL("/zugang", request.url);
    ziel.searchParams.set("weiter", pathname + search);
    return NextResponse.redirect(ziel);
  }

  if (istApiPfad(pathname)) return NextResponse.next();

  const sprache = bestimmeSprache({
    cookie: request.cookies.get(SPRACH_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    erkennungAktiv: I18N_OEFFENTLICH,
  });
  const intern = request.nextUrl.clone();
  intern.pathname = internerPfad(sprache, pathname);
  return NextResponse.rewrite(intern);
}

async function gateOffen(request: NextRequest): Promise<boolean> {
  const passwort = process.env.SITE_PASSWORD;
  const secret = process.env.SITE_SESSION_SECRET;
  if (!passwort || !secret) return true;
  return (await tokenPruefen(secret, request.cookies.get(COOKIE_NAME)?.value)) !== null;
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
