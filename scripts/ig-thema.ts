/**
 * Themen-Post als Publora-Entwurf (Spec 2026-10-14 Themen-Agent).
 *   npx tsx scripts/ig-thema.ts /tmp/thema.json [--probe]
 * JSON: { "schluessel": "limonen", "thema": IgThema, "caption": "…" }
 * Prüft die Caption (HWG, Sperrliste, 3–5 Hashtags), rendert die Karte lokal und legt den Entwurf an.
 * Das Bild heißt bot-thema-<art>-<schluessel>.png (Marke für den Agenten). Doppelte Marke = Abbruch.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { igThemenKarteHtml, type IgThema } from "../lib/ig-themen-karte";
import { entwurf, markenAus, publoraPosts, screenshot, umgebung } from "./ig-gemeinsam";

const ARTEN = new Set(["terpen", "feature", "mission", "schema"]);

async function main() {
  const [datei, ...rest] = process.argv.slice(2);
  if (!datei) throw new Error("Pfad zur JSON-Datei fehlt");
  const { schluessel, thema, caption } = JSON.parse(readFileSync(datei, "utf8")) as { schluessel: string; thema: IgThema; caption: string };
  if (!/^[a-z0-9-]{2,40}$/.test(schluessel)) throw new Error("schluessel: nur a-z, 0-9 und Bindestrich, 2 bis 40 Zeichen");
  if (!ARTEN.has(thema?.art)) throw new Error("thema.art: terpen, feature, mission oder schema");
  if (!thema.titel || !thema.text || !Array.isArray(thema.punkte)) throw new Error("thema braucht titel, text und punkte");
  const fehler = igCaptionPruefen(caption);
  if (fehler.length) throw new Error(`Caption abgelehnt: ${fehler.join("; ")}`);

  const marke = `bot-thema-${thema.art}-${schluessel}`;
  const ursprung = new URL(umgebung().IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const ordner = resolve("tmp/ig");
  mkdirSync(ordner, { recursive: true });
  const html = join(ordner, `${marke}.html`);
  const png = join(ordner, `${marke}.png`);
  // Aus file:// lädt Chromium Masken fremder Herkunft nicht (CORS): Logo direkt einbetten.
  const eingebettet = ["pinsel.webp", "pinsel-of.webp"].reduce(
    (h, name) =>
      h.replaceAll(`${ursprung}/marke/${name}`, `data:image/webp;base64,${readFileSync(resolve("public/marke", name)).toString("base64")}`),
    igThemenKarteHtml(thema, ursprung),
  );
  writeFileSync(html, eingebettet);
  screenshot(pathToFileURL(html).href, png);
  if (rest.includes("--probe")) {
    console.log(`Probe: ${png}`);
    return;
  }
  if (markenAus(await publoraPosts()).has(marke)) throw new Error(`Thema schon vorhanden: ${marke}`);
  const gruppe = await entwurf(caption, png, `${marke}.png`);
  console.log(`Entwurf angelegt: ${thema.titel} (Publora ${gruppe})`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
