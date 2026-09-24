/**
 * Bildverarbeitung der Medien-Pipeline (Spec 6.3). Nur Entwicklungszeit:
 * wird nie aus app/, components/ oder lib/ importiert.
 */
import sharp from "sharp";

/** Ab dieser Randhelligkeit gilt der Grund als hell und wird auf Weiss gezogen. */
const HELLER_GRUND = 180;

/** Median der Helligkeit im aeusseren Rand (5 %): dort liegt der Grund, nicht das Motiv. */
function randMedian(data: Buffer, breite: number, hoehe: number): number {
  const rand = Math.max(1, Math.round(Math.min(breite, hoehe) * 0.05));
  const werte: number[] = [];
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      if (x < rand || y < rand || x >= breite - rand || y >= hoehe - rand) werte.push(data[y * breite + x]);
    }
  }
  werte.sort((a, b) => a - b);
  return werte[Math.floor(werte.length / 2)];
}

/**
 * Graustufen-WebP in einer Breite, nie vergroessert.
 *
 * Weissabgleich: Fotos "vor hellem Grund" liegen oft auf Hellgrau. Mit
 * multiply bliebe davon ein graues Rechteck ueber dem Papier (Spec 4.5),
 * deshalb wird ein heller Grund linear auf Weiss gezogen. Ein dunkler Grund
 * (Video-Standbild) bleibt unveraendert.
 */
export async function zuGraustufenWebp(eingabe: Buffer, breite: number): Promise<Buffer> {
  const { data, info } = await sharp(eingabe)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const grund = randMedian(data, info.width, info.height);
  const bild = sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } });
  return (grund >= HELLER_GRUND ? bild.linear(255 / grund, 0) : bild).webp({ quality: 72 }).toBuffer();
}

/**
 * Standbild eines Videos als Quadrat aus der Mitte, in Graustufen. Der Loop
 * erscheint nur in einem quadratischen Fenster (object-cover); alles darueber
 * hinaus waere mitgeladen, aber nie zu sehen.
 */
export async function zuStandbildWebp(eingabe: Buffer, kante: number): Promise<Buffer> {
  return sharp(eingabe)
    .rotate()
    .resize({ width: kante, height: kante, fit: "cover", withoutEnlargement: true })
    .grayscale()
    .webp({ quality: 72 })
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
