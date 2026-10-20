/**
 * Terpz-Jury auf Instagram: ein veröffentlichter Beitrag als Karussell-Entwurf in Publora. Nichts wird geplant oder
 * veröffentlicht; den Collaborator verknüpft der Betreiber von Hand (Publora oder Instagram nach dem Veröffentlichen).
 *   npx tsx scripts/ig-jury.ts <slug> [--probe]
 * Umgebung: IG_FEED_URL (mit key) oder IG_FEED_KEY; Publora: PUBLORA_API_KEY, INSTAGRAM_PLATFORM_ID.
 * --probe rendert nur und schreibt nichts. Fehler: igStatus FEHLER melden, Abbruch ohne Wiederholung.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { collabHinweis, juryKarussell, type IgMeldung, type JuryFeedBeitrag } from "../lib/ig-jury";
import { igSlideHtml, karussellMarke, karussellPruefen } from "../lib/ig-karussell";
import { entwurfMedien, feedSchluessel, htmlOffline, markenAus, publoraPosts, screenshot, umgebung } from "./ig-gemeinsam";

async function meldeStatus(ursprung: string, schluessel: string, m: IgMeldung): Promise<void> {
  const antwort = await fetch(`${ursprung}/api/jury-ig?key=${encodeURIComponent(schluessel)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });
  if (!antwort.ok) throw new Error(`Meldung ${m.igStatus}: ${antwort.status}`);
}

/** Foto als 1080×1350-Bild (Bildschirmfoto), damit jedes Medium dasselbe Format hat und Instagram kein WebP bekommt. */
async function fotoPng(url: string, schluessel: string, ziel: string): Promise<void> {
  const antwort = await fetch(`${url}?key=${encodeURIComponent(schluessel)}`, { signal: AbortSignal.timeout(20_000) });
  if (!antwort.ok) throw new Error(`Foto ${url}: ${antwort.status}`);
  const typ = antwort.headers.get("content-type") ?? "image/webp";
  const daten = Buffer.from(await antwort.arrayBuffer()).toString("base64");
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1080px;height:1350px;background:#0c1512}img{display:block;width:1080px;height:1350px;object-fit:contain}</style><img alt="" src="data:${typ};base64,${daten}">`;
  const datei = ziel.replace(/\.png$/, ".html");
  writeFileSync(datei, html);
  screenshot(pathToFileURL(datei).href, ziel);
}

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  if (!slug) throw new Error("Slug fehlt");
  const env = umgebung();
  const schluessel = feedSchluessel(env);
  const ursprung = new URL(env.IG_FEED_URL ?? "https://www.bookofterpz.workers.dev").origin;
  const probe = rest.includes("--probe");
  try {
    const feed = await fetch(`${ursprung}/api/jury-feed?key=${encodeURIComponent(schluessel)}`, { signal: AbortSignal.timeout(20_000) });
    if (!feed.ok) throw new Error(`Feed: ${feed.status}`);
    const beitrag = ((await feed.json()) as { beitraege: JuryFeedBeitrag[] }).beitraege.find((b) => b.slug === slug);
    if (!beitrag) throw new Error(`Beitrag nicht im Feed (nicht veröffentlicht oder schon auf Instagram): ${slug}`);

    const { karussell, caption } = juryKarussell(beitrag);
    const fehler = [...karussellPruefen(karussell), ...igCaptionPruefen(caption)];
    if (fehler.length) throw new Error(`abgelehnt: ${fehler.join("; ")}`);

    const marke = karussellMarke(karussell);
    if (!probe && env.PUBLORA_API_KEY && markenAus(await publoraPosts()).has(marke)) throw new Error(`Karussell schon vorhanden: ${marke}`);

    const ordner = resolve("tmp/ig");
    mkdirSync(ordner, { recursive: true });
    const medien: { pfad: string; name: string; typ: "image/png" }[] = [];
    const neu = (): { name: string; pfad: string } => {
      const name = `${marke}-${medien.length + 1}`;
      return { name, pfad: join(ordner, `${name}.png`) };
    };
    for (const url of beitrag.bilder) {
      const { name, pfad } = neu();
      await fotoPng(url, schluessel, pfad);
      medien.push({ pfad, name: `${name}.png`, typ: "image/png" });
    }
    for (let i = 0; i < karussell.slides.length; i++) {
      const { name, pfad } = neu();
      // Aus file:// lädt Chromium Masken fremder Herkunft nicht (CORS): Logo direkt einbetten.
      const html = ["pinsel.webp", "pinsel-of.webp"].reduce(
        (h, logo) => h.replaceAll(`${ursprung}/marke/${logo}`, `data:image/webp;base64,${readFileSync(resolve("public/marke", logo)).toString("base64")}`),
        igSlideHtml(karussell, i, ursprung),
      );
      const htmlPfad = join(ordner, `${name}.html`);
      writeFileSync(htmlPfad, await htmlOffline(html));
      screenshot(pathToFileURL(htmlPfad).href, pfad);
      medien.push({ pfad, name: `${name}.png`, typ: "image/png" });
    }
    if (probe) {
      console.log(`Probe: ${medien.map((m) => m.pfad).join(", ")}\n\n${caption}`);
      return;
    }

    // Publora hat kein Collab-Feld: die Caption nennt die Autorin oder den Autor mit @; das Collab setzt der Betreiber.
    const gruppe = await entwurfMedien(caption, medien);
    await meldeStatus(ursprung, schluessel, { slug, igStatus: "ENTWURF" });
    console.log(`Entwurf angelegt (nicht geplant): ${karussell.slides[0].titel} (${medien.length} Bilder, Publora ${gruppe})`);
    console.log(collabHinweis(beitrag.autor));
  } catch (f) {
    // Die Probe schreibt nichts, auch keinen Fehlerstatus ans Portal.
    if (!probe) {
      try {
        await meldeStatus(ursprung, schluessel, { slug, igStatus: "FEHLER" });
      } catch {
        // Die Ursprungsmeldung zählt; ein zweiter Fehler überdeckt sie nicht.
      }
    }
    throw f;
  }
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
