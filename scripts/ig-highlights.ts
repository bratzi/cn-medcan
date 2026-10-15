/**
 * Vier Highlight-Cover 1080 × 1920 als PNG nach tmp/ig/highlights/ (Spec 2026-10-15 Produktmarke).
 *   npx tsx scripts/ig-highlights.ts
 * Die PNGs lädt der Betreiber in der Instagram-App als Cover hoch (Anleitung: docs/instagram/profil.md).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igHighlightHtml } from "../lib/ig-highlight";
import type { IgSaeule } from "../lib/ig-karussell";
import { htmlOffline, screenshot, umgebung } from "./ig-gemeinsam";

const COVER: Array<{ datei: string; titel: string; saeule: IgSaeule }> = [
  { datei: "was-ist-das", titel: "Was ist das", saeule: "transparenz" },
  { datei: "so-bewerten-wir", titel: "So bewerten wir", saeule: "transparenz" },
  { datei: "abstimmen", titel: "Abstimmen", saeule: "mitbestimmen" },
  { datei: "faq", titel: "FAQ", saeule: "portal" },
];

async function main() {
  const ursprung = new URL(umgebung().IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const ordner = resolve("tmp/ig/highlights");
  mkdirSync(ordner, { recursive: true });
  for (const c of COVER) {
    const html = join(ordner, `${c.datei}.html`);
    const png = join(ordner, `${c.datei}.png`);
    writeFileSync(html, await htmlOffline(igHighlightHtml(c.titel, c.saeule, ursprung)));
    screenshot(pathToFileURL(html).href, png, "1080,1920");
    console.log(png);
  }
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
