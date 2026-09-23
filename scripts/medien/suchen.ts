/**
 * Sucht Kandidaten auf Pexels (Spec 6.3, Schritt 1).
 *
 *   npx tsx scripts/medien/suchen.ts "cannabis leaf white background"
 *   npx tsx scripts/medien/suchen.ts "cannabis plants wind" --video
 *
 * Legt bis zu 15 Vorschauen (<id>.jpg) und kandidaten.json in
 * $MEDIEN_SCRATCH/<begriff>/ ab, Standard ist der Temp-Ordner. Eine Suche,
 * danach die Vorschauen nacheinander, keine Wiederholung.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ladeDatei, pexelsJson, pexelsKey } from "./pexels";

type Foto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  alt: string;
  src: { medium: string };
};

type Video = {
  id: number;
  width: number;
  height: number;
  url: string;
  duration: number;
  image: string;
  user: { name: string };
};

async function main() {
  const argumente = process.argv.slice(2);
  const video = argumente.includes("--video");
  const begriff = argumente.filter((a) => a !== "--video").join(" ").trim();
  if (!begriff) {
    console.error('Aufruf: npx tsx scripts/medien/suchen.ts "<suchbegriff>" [--video]');
    process.exit(1);
  }

  const key = pexelsKey();
  const name = (video ? "video-" : "") + begriff.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ziel = join(process.env.MEDIEN_SCRATCH ?? join(tmpdir(), "gruenes-buch-medien"), name);
  mkdirSync(ziel, { recursive: true });
  const anfrage = encodeURIComponent(begriff);
  const kandidaten: Record<string, unknown>[] = [];

  if (video) {
    const daten = await pexelsJson<{ videos: Video[] }>(
      `https://api.pexels.com/videos/search?query=${anfrage}&per_page=15&size=medium`,
      key,
    );
    for (const v of daten.videos) {
      writeFileSync(join(ziel, `${v.id}.jpg`), await ladeDatei(v.image));
      kandidaten.push({ id: v.id, urheber: v.user.name, quelle: v.url, breite: v.width, hoehe: v.height, dauer: v.duration });
    }
  } else {
    const daten = await pexelsJson<{ photos: Foto[] }>(
      `https://api.pexels.com/v1/search?query=${anfrage}&per_page=15`,
      key,
    );
    for (const f of daten.photos) {
      writeFileSync(join(ziel, `${f.id}.jpg`), await ladeDatei(f.src.medium));
      kandidaten.push({ id: f.id, urheber: f.photographer, quelle: f.url, breite: f.width, hoehe: f.height, alt: f.alt });
    }
  }

  writeFileSync(join(ziel, "kandidaten.json"), JSON.stringify(kandidaten, null, 2));
  console.log(`${kandidaten.length} Kandidaten in ${ziel}`);
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
