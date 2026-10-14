/**
 * Instagram-Entwürfe ohne Cowork (Nutzer 2026-10-14, Weg 2): holt neue Betreiber-Bewertungen aus dem
 * IG-Feed, macht mit Edge headless einen Screenshot der Karte (1080 × 1350) und legt je Bewertung einen
 * Publora-Entwurf mit Bild an. Veröffentlicht nie selbst: der Betreiber plant in Publora.
 *
 * Aufruf:
 *   npx tsx scripts/ig-entwuerfe.ts               neue Bewertungen als Entwurf (höchstens 3)
 *   npx tsx scripts/ig-entwuerfe.ts --probe       nur PNG und Caption nach tmp/ig/, nichts an Publora
 *   npx tsx scripts/ig-entwuerfe.ts --nur-merken  alle aktuellen Bewertungen als erledigt merken
 *   npx tsx scripts/ig-entwuerfe.ts --max=1       Obergrenze je Lauf
 *
 * Braucht .env (PUBLORA_API_KEY, INSTAGRAM_PLATFORM_ID) und .env.ig-feed (IG_FEED_KEY, IG_FEED_URL).
 * Erledigte Ids stehen in .ig-gepostet.txt (gitignored). Bei einem Fehler bricht der Lauf ab, ohne Wiederholung.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { igCaption } from "../lib/ig-caption";
import type { IgReview } from "../lib/ig-feed";

const PUBLORA = "https://api.publora.com/api/v1";
const GEPOSTET = ".ig-gepostet.txt";
const AUSGABE = resolve("tmp/ig");
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"];

function envLesen(datei: string): Record<string, string> {
  if (!existsSync(datei)) return {};
  return Object.fromEntries(
    readFileSync(datei, "utf8")
      .split(/\r?\n/)
      .map((z) => /^([A-Z0-9_]+)=(.*)$/.exec(z.trim()))
      .filter((t): t is RegExpExecArray => t !== null)
      .map((t) => [t[1], t[2].replace(/^["']|["']$/g, "")]),
  );
}

function pflicht(env: Record<string, string>, name: string): string {
  const wert = env[name];
  if (!wert) throw new Error(`${name} fehlt in .env oder .env.ig-feed`);
  return wert;
}

function gepostet(): Set<string> {
  return new Set(existsSync(GEPOSTET) ? readFileSync(GEPOSTET, "utf8").split(/\r?\n/).filter(Boolean) : []);
}

function screenshot(url: string, ziel: string): void {
  const edge = EDGE.find((p) => existsSync(p));
  if (!edge) throw new Error("Microsoft Edge nicht gefunden");
  execFileSync(edge, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1350",
    "--virtual-time-budget=8000",
    `--screenshot=${ziel}`,
    url,
  ], { stdio: "ignore", timeout: 60_000 });
  if (!existsSync(ziel)) throw new Error(`Screenshot fehlt: ${ziel}`);
}

async function publora<T>(schluessel: string, pfad: string, body: unknown): Promise<T> {
  const antwort = await fetch(`${PUBLORA}/${pfad}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publora-key": schluessel },
    body: JSON.stringify(body),
  });
  const daten = (await antwort.json().catch(() => ({}))) as T & { success?: boolean; error?: string };
  if (!antwort.ok || daten.success === false) throw new Error(`Publora ${pfad}: ${antwort.status} ${daten.error ?? ""}`.trim());
  return daten;
}

async function entwurf(schluessel: string, plattform: string, caption: string, png: string, id: string): Promise<string> {
  const { postGroupId } = await publora<{ postGroupId: string }>(schluessel, "create-post", { content: caption, platforms: [plattform] });
  const { uploadUrl } = await publora<{ uploadUrl: string }>(schluessel, "get-upload-url", {
    fileName: `${id}.png`,
    contentType: "image/png",
    type: "image",
    postGroupId,
  });
  const hoch = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: readFileSync(png) });
  if (!hoch.ok) throw new Error(`Bild-Upload: ${hoch.status}`);
  return postGroupId;
}

async function main() {
  const args = process.argv.slice(2);
  const probe = args.includes("--probe");
  const nurMerken = args.includes("--nur-merken");
  const max = Number(args.find((a) => a.startsWith("--max="))?.slice(6) ?? 3);
  const env = { ...envLesen(".env"), ...envLesen(".env.ig-feed") };

  const feedUrl = pflicht(env, "IG_FEED_URL");
  const key = pflicht(env, "IG_FEED_KEY");
  const antwort = await fetch(feedUrl);
  if (!antwort.ok) throw new Error(`Feed: ${antwort.status}`);
  const { reviews } = (await antwort.json()) as { reviews: IgReview[] };
  const erledigt = gepostet();
  const neu = reviews.filter((r) => !erledigt.has(r.id));

  if (nurMerken) {
    if (neu.length) appendFileSync(GEPOSTET, neu.map((r) => `${r.id}\n`).join(""));
    console.log(`${neu.length} Bewertungen als erledigt gemerkt.`);
    return;
  }
  if (!neu.length) {
    console.log("Keine neuen Bewertungen.");
    return;
  }

  mkdirSync(AUSGABE, { recursive: true });
  const schluessel = probe ? "" : pflicht(env, "PUBLORA_API_KEY");
  const plattform = probe ? "" : pflicht(env, "INSTAGRAM_PLATFORM_ID");

  for (const r of neu.slice(0, max)) {
    const png = join(AUSGABE, `${r.id}.png`);
    const caption = igCaption(r);
    screenshot(`${r.karte}?key=${encodeURIComponent(key)}`, png);
    writeFileSync(join(AUSGABE, `${r.id}.txt`), caption);
    if (probe) {
      console.log(`Probe: ${r.bluete} -> ${png}`);
      continue;
    }
    const gruppe = await entwurf(schluessel, plattform, caption, png, r.id);
    appendFileSync(GEPOSTET, `${r.id}\n`);
    console.log(`Entwurf angelegt: ${r.bluete} (Publora ${gruppe})`);
  }
  if (neu.length > max) console.log(`${neu.length - max} weitere beim nächsten Lauf.`);
}

main().catch((fehler: unknown) => {
  console.error(fehler instanceof Error ? fehler.message : fehler);
  process.exit(1);
});
