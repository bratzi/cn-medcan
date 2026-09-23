/**
 * Bildverarbeitung der Medien-Pipeline (Spec 6.3). Nur Entwicklungszeit:
 * wird nie aus app/, components/ oder lib/ importiert.
 */
import sharp from "sharp";

/** Graustufen-WebP in einer Breite, nie vergroessert. */
export async function zuGraustufenWebp(eingabe: Buffer, breite: number): Promise<Buffer> {
  return sharp(eingabe)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .grayscale()
    .webp({ quality: 72 })
    .toBuffer();
}

/**
 * Wand-Textur als Alpha-Maske: Luminanz wird Deckkraft (Spec 4.5).
 * Dunkle Farbe auf hellem Grund wird deckend; mit `umkehren` helle Farbe
 * auf dunklem Grund. `normalise` spreizt den Tonwertumfang, damit auch
 * blasse Farbe eine kraeftige Maske ergibt. Die Farbe selbst bleibt
 * schwarz: eingefaerbt wird per CSS (`.wand-textur`).
 */
export async function zuMaskePng(eingabe: Buffer, breite: number, umkehren = false): Promise<Buffer> {
  const { data, info } = await sharp(eingabe)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixel = info.width * info.height;
  const rgba = Buffer.alloc(pixel * 4);
  for (let i = 0; i < pixel; i++) {
    const helligkeit = data[i * info.channels];
    rgba[i * 4 + 3] = umkehren ? helligkeit : 255 - helligkeit;
  }

  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

export type PexelsVideoDatei = {
  quality: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

/** Die breiteste SD-Datei bis 960 px; gibt es keine, die schmalste MP4. */
export function waehleSdVideo(dateien: readonly PexelsVideoDatei[]): PexelsVideoDatei | null {
  const mp4 = dateien.filter((d) => d.file_type === "video/mp4" && d.width !== null);
  const sd = mp4
    .filter((d) => d.quality === "sd" && (d.width ?? 0) <= 960)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  if (sd.length > 0) return sd[0];
  return [...mp4].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))[0] ?? null;
}
