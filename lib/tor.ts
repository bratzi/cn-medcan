import { SPRACH_ERKENNUNG } from "./i18n/schalter";
import { bestimmeSprache, SPRACH_COOKIE } from "./i18n/sprache-kern";
import { alteStrainAdresse, SEITEN_PRAEFIX, seitenDatei } from "./seiten-tor";
import { inselRoh, type InselEnv } from "./insel-roh";

export type TorEnv = InselEnv & {
  ASSETS: { fetch(r: Request | string): Promise<Response> };
};

/**
 * Leichter Weg vor Next (Spec 2026-10-21, Seiten aus Assets, 3.2): Leseseite als Datei ausliefern.
 * `null` heißt: Next übernimmt (Admin, Aktionen, API, Seiten ohne Datei). Ohne Passwortschranke seit
 * 2026-10-22 (Nutzer): die Leseseiten sind öffentlich, Rechte prüft die Schreibschicht.
 * Relative Importe, damit wrangler diese Datei ohne tsconfig-Alias bündelt (worker.mjs).
 */
export async function tor(request: Request, env: TorEnv): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const cookies = leseCookies(request.headers.get("cookie"));

  if (url.pathname.startsWith(`${SEITEN_PRAEFIX}/`) || url.pathname === SEITEN_PRAEFIX) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (url.pathname === "/api/ich/strain") {
    // Mit Sitzungscookie: rohe D1-Abfragen statt Next (HANDOFF S87, 623 ms CPU). Ohne Bindings übernimmt Next.
    if (hatSitzung(cookies)) {
      try {
        return await inselRoh(url, cookies, env);
      } catch (fehler) {
        // Fehler im rohen Weg: Next beantwortet die Anfrage wie bisher (teurer, aber korrekt).
        console.error(JSON.stringify({ tor: "insel", fehler: String(fehler) }));
        return null;
      }
    }
    return Response.json({ zugang: "gast" }, { headers: { "Cache-Control": "private, no-store" } });
  }
  // Vertreiber ist seit 2026-10-22 kein Seitenzustand mehr: alte Adressen dauerhaft auf die eine Strain-Seite.
  const neu = alteStrainAdresse(url.pathname, url.searchParams);
  if (neu) return new Response(null, { status: 308, headers: { Location: new URL(neu, url).toString() } });
  const sprache = bestimmeSprache({
    cookie: cookies.get(SPRACH_COOKIE),
    acceptLanguage: request.headers.get("accept-language"),
    erkennungAktiv: SPRACH_ERKENNUNG,
  });
  const datei = seitenDatei(sprache, url.pathname, url.searchParams);
  if (!datei) return null;
  const antwort = await env.ASSETS.fetch(new URL(datei, url).toString());
  if (antwort.status !== 200) {
    // 404 ist der erwartete Ausweichweg (neue Seite seit dem Build); alles andere ist ein Fehler im Aufbau.
    if (antwort.status !== 404) console.warn(JSON.stringify({ tor: "asset", status: antwort.status, datei }));
    return null;
  }
  return new Response(request.method === "HEAD" ? null : antwort.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Vary Cookie: die Seite ist für alle gleich, aber Sprache und Insel hängen am Cookie.
      "Cache-Control": "private, no-cache",
      Vary: "Cookie",
    },
  });
}

function leseCookies(kopf: string | null): Map<string, string> {
  const karte = new Map<string, string>();
  for (const teil of (kopf ?? "").split(";")) {
    const i = teil.indexOf("=");
    if (i > 0) karte.set(teil.slice(0, i).trim(), teil.slice(i + 1).trim());
  }
  return karte;
}

// Namen wie getSessionCookie aus better-auth/cookies (Punkt- und Bindestrich-Form, je mit __Secure-).
const SITZUNGS_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
];

function hatSitzung(cookies: Map<string, string>): boolean {
  return SITZUNGS_COOKIES.some((name) => Boolean(cookies.get(name)));
}

