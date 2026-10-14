/**
 * Instagram-Entwürfe für neue Betreiber-Bewertungen (Nutzer 2026-10-14): holt sie aus dem IG-Feed, macht
 * einen Screenshot der Karte (1080 × 1350) und legt je Bewertung einen Publora-Entwurf mit Bild an.
 * Veröffentlicht nie selbst: der Betreiber plant in Publora. Läuft lokal (Edge) und in der Cloud-Routine.
 *
 * Aufruf:
 *   npx tsx scripts/ig-entwuerfe.ts               neue Bewertungen als Entwurf (höchstens 3)
 *   npx tsx scripts/ig-entwuerfe.ts --probe       nur PNG und Caption nach tmp/ig/, nichts an Publora
 *   npx tsx scripts/ig-entwuerfe.ts --nur-merken  alle aktuellen Bewertungen lokal als erledigt merken
 *   npx tsx scripts/ig-entwuerfe.ts --max=1       Obergrenze je Lauf
 *
 * Braucht PUBLORA_API_KEY, INSTAGRAM_PLATFORM_ID, IG_FEED_URL (Umgebung, .env oder .env.ig-feed).
 * Erledigt ist eine Bewertung, wenn ihre Id in .ig-gepostet.txt (lokal, gitignored) oder
 * docs/instagram/ausgeschlossen.txt steht oder ein Publora-Post ein Bild <id>.png trägt.
 * Bei einem Fehler bricht der Lauf ab, ohne Wiederholung.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { igCaption } from "../lib/ig-caption";
import type { IgReview } from "../lib/ig-feed";
import { entwurf, feedSchluessel, markenAus, pflicht, publoraPosts, screenshot, umgebung } from "./ig-gemeinsam";

const GEPOSTET = ".ig-gepostet.txt";
/** Im Repo, damit auch die Cloud-Routine Test- und Beispielbewertungen auslässt. */
const AUSGESCHLOSSEN = "docs/instagram/ausgeschlossen.txt";
const AUSGABE = resolve("tmp/ig");

function idsAus(datei: string): string[] {
  if (!existsSync(datei)) return [];
  return readFileSync(datei, "utf8")
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z && !z.startsWith("#"));
}

function gepostet(): Set<string> {
  return new Set([...idsAus(GEPOSTET), ...idsAus(AUSGESCHLOSSEN)]);
}

async function main() {
  const args = process.argv.slice(2);
  const probe = args.includes("--probe");
  const nurMerken = args.includes("--nur-merken");
  const max = Number(args.find((a) => a.startsWith("--max="))?.slice(6) ?? 3);
  const env = umgebung();

  const key = feedSchluessel(env);
  const antwort = await fetch(pflicht(env, "IG_FEED_URL"));
  if (!antwort.ok) throw new Error(`Feed: ${antwort.status}`);
  const { reviews } = (await antwort.json()) as { reviews: IgReview[] };
  const erledigt = gepostet();
  if (!nurMerken) for (const m of markenAus(await publoraPosts())) erledigt.add(m);
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
  for (const r of neu.slice(0, max)) {
    const png = join(AUSGABE, `${r.id}.png`);
    const caption = igCaption(r);
    screenshot(`${r.karte}?key=${encodeURIComponent(key)}`, png);
    writeFileSync(join(AUSGABE, `${r.id}.txt`), caption);
    if (probe) {
      console.log(`Probe: ${r.bluete} -> ${png}`);
      continue;
    }
    const gruppe = await entwurf(caption, png, `${r.id}.png`);
    appendFileSync(GEPOSTET, `${r.id}\n`);
    console.log(`Entwurf angelegt: ${r.bluete} (Publora ${gruppe})`);
  }
  if (neu.length > max) console.log(`${neu.length - max} weitere beim nächsten Lauf.`);
}

main().catch((fehler: unknown) => {
  console.error(fehler instanceof Error ? fehler.message : fehler);
  process.exit(1);
});
