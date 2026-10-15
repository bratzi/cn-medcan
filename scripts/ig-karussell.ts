/**
 * Karussell als Publora-Entwurf (Spec 2026-10-15 Produktmarke).
 *   npx tsx scripts/ig-karussell.ts /tmp/karussell.json [--probe] [--planen=<ISO|jetzt>]
 * JSON: { "karussell": IgKarussell, "caption": "…" }. Prüft Slides und Caption, fotografiert jede Slide
 * und legt einen Entwurf mit allen Bildern an. Bildnamen bot-k-<saeule>-<schluessel>-<n>.png = Marke.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { igSlideHtml, karussellMarke, karussellPruefen, type IgKarussell } from "../lib/ig-karussell";
import { entwurfMedien, planenMitStory, planZeit, htmlOffline, markenAus, publoraPosts, screenshot, storyEntwurf, umgebung } from "./ig-gemeinsam";

async function main() {
  const [datei, ...rest] = process.argv.slice(2);
  if (!datei) throw new Error("Pfad zur JSON-Datei fehlt");
  const { karussell, caption } = JSON.parse(readFileSync(datei, "utf8")) as { karussell: IgKarussell; caption: string };
  const fehler = [...karussellPruefen(karussell), ...igCaptionPruefen(caption)];
  if (fehler.length) throw new Error(`abgelehnt: ${fehler.join("; ")}`);

  const marke = karussellMarke(karussell);
  const ursprung = new URL(umgebung().IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const probe = rest.includes("--probe");
  // Zeit vorab prüfen, damit kein Entwurf ohne gültigen Termin entsteht.
  const planArg = rest.find((a) => a.startsWith("--planen="))?.slice(9);
  const zeit = planArg ? planZeit(planArg) : undefined;
  if (!probe && markenAus(await publoraPosts()).has(marke)) throw new Error(`Karussell schon vorhanden: ${marke}`);
  const ordner = resolve("tmp/ig");
  mkdirSync(ordner, { recursive: true });
  const medien = [];
  for (let i = 0; i < karussell.slides.length; i++) {
    const name = `${marke}-${i + 1}`;
    // Aus file:// lädt Chromium Masken fremder Herkunft nicht (CORS): Logo direkt einbetten.
    const html = ["pinsel.webp", "pinsel-of.webp"].reduce(
      (h, logo) =>
        h.replaceAll(`${ursprung}/marke/${logo}`, `data:image/webp;base64,${readFileSync(resolve("public/marke", logo)).toString("base64")}`),
      igSlideHtml(karussell, i, ursprung),
    );
    const htmlPfad = join(ordner, `${name}.html`);
    const png = join(ordner, `${name}.png`);
    writeFileSync(htmlPfad, await htmlOffline(html));
    screenshot(pathToFileURL(htmlPfad).href, png);
    medien.push({ pfad: png, name: `${name}.png`, typ: "image/png" as const });
  }
  if (probe) {
    console.log(`Probe: ${medien.map((m) => m.pfad).join(", ")}`);
    return;
  }
  const gruppe = await entwurfMedien(caption, medien);
  console.log(`Entwurf angelegt: ${karussell.slides[0].titel} (${medien.length} Slides, Publora ${gruppe})`);
  const story = await storyEntwurf(marke, medien[0].pfad);
  console.log(`Story-Entwurf angelegt (Publora ${story})`);
  if (zeit) {
    await planenMitStory(gruppe, zeit);
    console.log(`Eingeplant um ${zeit}, Story eine Minute später`);
  }
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
