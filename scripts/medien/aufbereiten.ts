/**
 * Laedt die in lib/medien.ts gewaehlten Originale und legt die Dateien in
 * public/medien ab (Spec 6.3, Schritt 3). Vollstaendig vorhandene Medien
 * werden uebersprungen, der Lauf ist also wiederholbar ohne neue Downloads.
 *
 *   npx tsx scripts/medien/aufbereiten.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  MASKEN_BREITE,
  MEDIEN,
  STANDBILD_BREITE,
  dateienVon,
  fotoBreiten,
  type Medium,
} from "../../lib/medien";
import { ladeDatei, pexelsJson, pexelsKey } from "./pexels";
import { waehleSdVideo, zuGraustufenWebp, zuMaskePng, type PexelsVideoDatei } from "./verarbeitung";

const ZIEL = join(process.cwd(), "public", "medien");

/** Pexels liefert verkleinerte Fassungen ueber Parameter; 2400 px reichen fuer 1920. */
const ORIGINAL_PARAMETER = "?auto=compress&cs=tinysrgb&w=2400";

function schreibe(name: string, inhalt: Buffer) {
  writeFileSync(join(ZIEL, name), inhalt);
  console.log(`${name.padEnd(36)} ${Math.round(inhalt.length / 1024)} KB`);
}

async function bild(m: Medium, key: string) {
  const daten = await pexelsJson<{ src: { original: string } }>(
    `https://api.pexels.com/v1/photos/${m.pexelsId}`,
    key,
  );
  const original = await ladeDatei(daten.src.original + ORIGINAL_PARAMETER);
  if (m.art === "maske") {
    schreibe(`${m.datei}-maske.png`, await zuMaskePng(original, MASKEN_BREITE, m.maskeUmkehren));
    return;
  }
  for (const breite of fotoBreiten(m)) {
    schreibe(`${m.datei}-${breite}.webp`, await zuGraustufenWebp(original, breite));
  }
}

async function video(m: Medium, key: string) {
  const daten = await pexelsJson<{ image: string; video_files: PexelsVideoDatei[] }>(
    `https://api.pexels.com/videos/videos/${m.pexelsId}`,
    key,
  );
  const datei = waehleSdVideo(daten.video_files);
  if (!datei) throw new Error(`Video ${m.pexelsId}: keine MP4-Datei`);
  schreibe(`${m.datei}.mp4`, await ladeDatei(datei.link));
  schreibe(`${m.datei}-standbild.webp`, await zuGraustufenWebp(await ladeDatei(daten.image), STANDBILD_BREITE));
}

async function main() {
  mkdirSync(ZIEL, { recursive: true });
  const offen = MEDIEN.filter((m) => !dateienVon(m).every((d) => existsSync(join(ZIEL, d))));
  if (offen.length === 0) {
    console.log("Alle Medien vorhanden.");
    return;
  }
  const key = pexelsKey();
  for (const m of offen) {
    if (m.art === "video") await video(m, key);
    else await bild(m, key);
  }
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
