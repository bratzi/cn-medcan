/**
 * Passwort-Gate fuer die Entwicklungsphase.
 *
 * Kostenlos und ohne eigene Domain: laeuft auf einer workers.dev-Subdomain.
 * Cloudflare Access (Zero Trust, E-Mail-PIN) waere der bequemere Weg, schuetzt
 * aber nur eigene Domains in einer Cloudflare-Zone - nicht workers.dev.
 * Sobald eine Domain vorhanden ist, siehe .claude/skills/edge-stack-master.md.
 *
 * Verfahren: Passwort wird nie im Cookie gespeichert. Der Cookie traegt
 * Ablaufzeit und Rolle im Klartext plus einen HMAC-SHA-256 ueber
 * "gate:<ablaufzeit>:<rolle>", signiert mit SITE_SESSION_SECRET.
 *
 * Die Rolle steht damit zwar lesbar im Cookie, ist aber nicht faelschbar: wer
 * sie aendert, ohne das Secret zu kennen, bekommt eine ungueltige Signatur
 * und faellt auf "kein Zugang" zurueck. Das ist die Grundlage des
 * Fachkreis-Gates (Paragraph 10 HWG) - siehe lib/query/fachkreis.ts.
 */

/** Wer mit SITE_PASSWORD hereinkommt, sieht keine Preise; FACHKREIS_PASSWORD schon. */
export const ROLLEN = ["besucher", "fachkreis"] as const;
export type GateRolle = (typeof ROLLEN)[number];

function istRolle(wert: string): wert is GateRolle {
  return (ROLLEN as readonly string[]).includes(wert);
}

const COOKIE_NAME = "cn_gate";
const GUELTIGKEIT_SEKUNDEN = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

async function hmac(secret: string, nachricht: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatur = await crypto.subtle.sign("HMAC", key, encoder.encode(nachricht));
  return [...new Uint8Array(signatur)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Zeitkonstanter Vergleich - verhindert Timing-Rueckschluesse auf das Passwort. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let abweichung = 0;
  for (let i = 0; i < a.length; i++) {
    abweichung |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return abweichung === 0;
}

export async function tokenErzeugen(
  secret: string,
  rolle: GateRolle
): Promise<string> {
  const ablauf = Math.floor(Date.now() / 1000) + GUELTIGKEIT_SEKUNDEN;
  const signatur = await hmac(secret, `gate:${ablauf}:${rolle}`);
  return `${ablauf}.${rolle}.${signatur}`;
}

/**
 * Prueft das Token und gibt die darin beglaubigte Rolle zurueck, oder `null`,
 * wenn es fehlt, abgelaufen ist oder die Signatur nicht passt.
 *
 * Bewusst kein Boolean: der Aufrufer soll die Rolle nur aus dem geprueften
 * Token beziehen koennen und nicht in Versuchung geraten, sie daneben aus
 * einem ungeprueften Cookie-Teil zu lesen.
 */
export async function tokenPruefen(
  secret: string,
  token: string | undefined
): Promise<GateRolle | null> {
  if (!token) return null;
  const [ablaufRoh, rolleRoh, signatur] = token.split(".");
  if (!ablaufRoh || !rolleRoh || !signatur) return null;
  if (!istRolle(rolleRoh)) return null;

  const ablauf = Number(ablaufRoh);
  if (!Number.isFinite(ablauf) || ablauf < Math.floor(Date.now() / 1000)) return null;

  const erwartet = await hmac(secret, `gate:${ablaufRoh}:${rolleRoh}`);
  return gleich(erwartet, signatur) ? rolleRoh : null;
}

export async function passwortPruefen(erwartet: string, eingabe: string): Promise<boolean> {
  // Beide Seiten hashen, damit der Vergleich unabhaengig von der Laenge konstant bleibt.
  const [a, b] = await Promise.all([
    hmac(erwartet, "pw"),
    hmac(eingabe, "pw"),
  ]);
  return gleich(a, b);
}

export { COOKIE_NAME, GUELTIGKEIT_SEKUNDEN };
