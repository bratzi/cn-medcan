/**
 * Reel als Publora-Video-Entwurf (Spec 2026-10-15 Produktmarke).
 *   npx tsx scripts/ig-reel.ts video/out/bot-reel-<schluessel>.mp4 docs/instagram/reels/<schluessel>.txt
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { igCaptionPruefen } from "../lib/ig-caption";
import { entwurfMedien, markenAus, publoraPosts } from "./ig-gemeinsam";

async function main() {
  const [mp4, captionDatei] = process.argv.slice(2);
  if (!mp4 || !captionDatei) throw new Error("Aufruf: ig-reel.ts <mp4> <caption.txt>");
  const name = basename(mp4);
  if (!/^bot-reel-[a-z0-9-]+\.mp4$/.test(name)) throw new Error("Dateiname muss bot-reel-<schluessel>.mp4 sein");
  const caption = readFileSync(captionDatei, "utf8").trim();
  const fehler = igCaptionPruefen(caption);
  if (fehler.length) throw new Error(`Caption abgelehnt: ${fehler.join("; ")}`);
  if (markenAus(await publoraPosts()).has(name.replace(/\.mp4$/, ""))) throw new Error(`Reel schon vorhanden: ${name}`);
  const gruppe = await entwurfMedien(caption, [{ pfad: mp4, name, typ: "video/mp4" }]);
  console.log(`Reel-Entwurf angelegt (Publora ${gruppe})`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
