/**
 * Terpz-Jury auf Instagram (Task 9): ein veröffentlichter Beitrag als Karussell mit Collab auf die Autorin
 * oder den Autor. Fotos des Beitrags stehen vor den Text-Slides.
 *   npx tsx scripts/ig-jury.ts <slug> [--probe] [--planen=<ISO|jetzt>] [--veroeffentlichen]
 * Umgebung: IG_FEED_URL (mit key) oder IG_FEED_KEY; Publora: PUBLORA_API_KEY, INSTAGRAM_PLATFORM_ID.
 * Direkt über die Graph-API nur mit --veroeffentlichen und IG_GRAPH_TOKEN, IG_BUSINESS_ID, IG_MEDIEN_BASIS_URL
 * (öffentlicher Ordner, aus dem Instagram die JPEG/PNG-Dateien aus tmp/ig/ unter ihrem Dateinamen abholt).
 * Fehler: igStatus FEHLER melden, Abbruch ohne Wiederholung.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { graphKarussellSchritte } from "../lib/ig-graph";
import { IG_PROFIL_ADRESSE, igMeldungPruefen, juryKarussell, type IgMeldung, type JuryFeedBeitrag } from "../lib/ig-jury";
import { igSlideHtml, karussellMarke, karussellPruefen } from "../lib/ig-karussell";
import { entwurfMedien, feedSchluessel, htmlOffline, markenAus, planen, planZeit, publoraPosts, screenshot, tagBelegt, umgebung } from "./ig-gemeinsam";

const GRAPH = "https://graph.facebook.com/v21.0";

async function meldeStatus(ursprung: string, schluessel: string, m: IgMeldung): Promise<void> {
  const antwort = await fetch(`${ursprung}/api/jury-ig?key=${encodeURIComponent(schluessel)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });
  if (!antwort.ok) throw new Error(`Meldung ${m.igStatus}: ${antwort.status}`);
}

async function graph<T>(pfad: string, parameter: Record<string, string>, token: string, methode: "POST" | "GET" = "POST"): Promise<T> {
  const url = `${GRAPH}/${pfad}`;
  const antwort = await (methode === "GET"
    ? fetch(`${url}?${new URLSearchParams({ ...parameter, access_token: token })}`)
    : fetch(url, { method: "POST", body: new URLSearchParams({ ...parameter, access_token: token }) }));
  const daten = (await antwort.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!antwort.ok || daten.error) throw new Error(`Graph ${pfad}: ${antwort.status} ${daten.error?.message ?? ""}`.trim());
  return daten;
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
  const ursprung = new URL(env.IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const probe = rest.includes("--probe");
  const planArg = rest.find((a) => a.startsWith("--planen="))?.slice(9);
  const direkt = rest.includes("--veroeffentlichen") && Boolean(env.IG_GRAPH_TOKEN && env.IG_BUSINESS_ID);

  let live = false;
  try {
    const feed = await fetch(`${ursprung}/api/jury-feed?key=${encodeURIComponent(schluessel)}`, { signal: AbortSignal.timeout(20_000) });
    if (!feed.ok) throw new Error(`Feed: ${feed.status}`);
    const beitrag = ((await feed.json()) as { beitraege: JuryFeedBeitrag[] }).beitraege.find((b) => b.slug === slug);
    if (!beitrag) throw new Error(`Beitrag nicht im Feed (nicht veröffentlicht oder schon auf Instagram): ${slug}`);

    const { karussell, caption } = juryKarussell(beitrag);
    const fehler = [...karussellPruefen(karussell), ...igCaptionPruefen(caption)];
    if (fehler.length) throw new Error(`abgelehnt: ${fehler.join("; ")}`);

    const marke = karussellMarke(karussell);
    const zeit = planArg ? planZeit(planArg) : undefined;
    if (!probe && !direkt && env.PUBLORA_API_KEY && markenAus(await publoraPosts()).has(marke)) throw new Error(`Karussell schon vorhanden: ${marke}`);

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

    if (direkt) {
      const token = env.IG_GRAPH_TOKEN!;
      const basis = env.IG_MEDIEN_BASIS_URL?.replace(/\/$/, "");
      if (!basis) throw new Error("IG_MEDIEN_BASIS_URL fehlt: Instagram braucht öffentliche Bild-Adressen");
      const urls = medien.map((m) => `${basis}/${m.name}`);
      for (const u of urls) if (!(await fetch(u, { method: "HEAD" })).ok) throw new Error(`Bild nicht erreichbar: ${u}`);
      if (tagBelegt((await publoraPosts()) as { status?: string; scheduledTime?: string }[])) {
        console.log("Heute ist schon ein Post eingeplant oder erschienen: nichts veröffentlicht.");
        return;
      }
      const handle = beitrag.autor.instagram?.replace(/^@+/, "");
      const kinder: string[] = [];
      let behaelter = "";
      for (const schritt of graphKarussellSchritte(urls, caption, handle ? [handle] : [])) {
        const id = `${env.IG_BUSINESS_ID}/${schritt.pfad}`;
        if (schritt.pfad === "media_publish") {
          const { id: medienId } = await graph<{ id: string }>(id, { creation_id: behaelter }, token);
          // Ab hier steht der Post auf Instagram: nie mehr FEHLER melden, sonst bleibt er im Feed und wird doppelt gepostet.
          live = true;
          let permalink: string = IG_PROFIL_ADRESSE;
          try {
            const p = (await graph<{ permalink?: string }>(medienId, { fields: "permalink" }, token, "GET")).permalink;
            if (p && igMeldungPruefen({ slug, igStatus: "VEROEFFENTLICHT", igUrl: p }).length === 0) permalink = p;
          } catch {
            // Fallback: Profiladresse; der Beitrag gilt trotzdem als veröffentlicht.
          }
          console.log(`Veröffentlicht: ${permalink} (Medien-Id ${medienId})`);
          await meldeStatus(ursprung, schluessel, { slug, igStatus: "VEROEFFENTLICHT", igUrl: permalink });
        } else if (schritt.parameter.media_type === "CAROUSEL") {
          behaelter = (await graph<{ id: string }>(id, { ...schritt.parameter, children: kinder.join(",") }, token)).id;
        } else {
          kinder.push((await graph<{ id: string }>(id, schritt.parameter, token)).id);
        }
      }
      return;
    }

    // Publora hat kein Collab-Feld: die Caption nennt die Autorin oder den Autor mit @.
    const gruppe = await entwurfMedien(caption, medien);
    console.log(`Entwurf angelegt: ${karussell.slides[0].titel} (${medien.length} Bilder, Publora ${gruppe})`);
    let status: IgMeldung["igStatus"] = "ENTWURF";
    if (zeit) {
      if (tagBelegt((await publoraPosts()) as { status?: string; scheduledTime?: string }[])) {
        console.log("Heute ist schon ein Post eingeplant oder erschienen: Entwurf bleibt liegen.");
      } else {
        await planen(gruppe, zeit);
        live = true; // eingeplant: ein späterer Fehler darf den Beitrag nicht erneut in den Feed schicken
        status = "GEPLANT";
        console.log(`Eingeplant um ${zeit}`);
      }
    }
    await meldeStatus(ursprung, schluessel, { slug, igStatus: status });
  } catch (f) {
    if (live) throw new Error(`${f instanceof Error ? f.message : String(f)} (Post ist raus, Status ${slug} von Hand nachtragen, kein FEHLER gemeldet)`);
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
