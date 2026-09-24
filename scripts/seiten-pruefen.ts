/**
 * Prueft ausgelieferte Seiten gegen Spec TP2 9.2 und 9.3: kein Geviertstrich,
 * kein Gedankenstrich als Trenner (Zahlenbereiche wie "22,0 – 28,0 %" sind
 * erlaubt), keine Umschrift, genau ein h1, keine doppelten Ids.
 * Aufruf gegen den laufenden Dev-Server:
 *   npx tsx scripts/seiten-pruefen.ts /reviews /umfragen /produkte/nebelharz-22
 * Das Gate-Cookie entsteht aus SITE_SESSION_SECRET in .env.local; der Wert
 * wird nie ausgegeben.
 */
import { readFileSync } from "node:fs";

import { COOKIE_NAME, tokenErzeugen } from "../lib/gate";

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

function geheimnis(): string {
  const zeile = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((z) => z.startsWith("SITE_SESSION_SECRET="));
  if (!zeile) throw new Error("SITE_SESSION_SECRET fehlt in .env.local");
  return zeile.slice("SITE_SESSION_SECRET=".length).trim().replace(/^"|"$/g, "");
}

/** Sichtbarer Text ungefaehr: Skripte und Styles raus, Tags raus. */
function sichtbar(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

const REGELN: { name: string; muster: RegExp }[] = [
  { name: "Geviertstrich", muster: /—/ },
  { name: "Gedankenstrich als Trenner", muster: /(?<!\d)\s–\s|\s–\s(?!\d)/ },
  { name: "Umschrift", muster: /\b(fuer|oeffentlich|Uebersicht|aendern|koennen|muessen)\b/ },
];

async function pruefe(pfad: string, cookie: string): Promise<string[]> {
  const antwort = await fetch(`${BASIS}${pfad}`, { headers: { cookie }, redirect: "manual" });
  if (antwort.status !== 200 && antwort.status !== 404) return [`Status ${antwort.status}`];
  const html = await antwort.text();
  const text = sichtbar(html);
  const fehler = REGELN.filter((regel) => regel.muster.test(text)).map((regel) => {
    const stelle = text.search(regel.muster);
    return `${regel.name}: "${text.slice(Math.max(0, stelle - 40), stelle + 40).replace(/\s+/g, " ")}"`;
  });
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1 !== 1) fehler.push(`${h1} h1 statt genau einem`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((treffer) => treffer[1]);
  const doppelt = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (doppelt.length > 0) fehler.push(`doppelte Ids: ${doppelt.join(", ")}`);
  return fehler;
}

async function main() {
  const pfade = process.argv.slice(2);
  if (pfade.length === 0) throw new Error("Aufruf: npx tsx scripts/seiten-pruefen.ts /pfad …");
  const cookie = `${COOKIE_NAME}=${await tokenErzeugen(geheimnis(), "besucher")}`;
  let verstoesse = 0;
  for (const pfad of pfade) {
    const fehler = await pruefe(pfad, cookie);
    verstoesse += fehler.length;
    console.log(fehler.length === 0 ? `ok   ${pfad}` : `FEHL ${pfad}\n  ${fehler.join("\n  ")}`);
  }
  process.exitCode = verstoesse > 0 ? 1 : 0;
}

main();
