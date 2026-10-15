/**
 * Zuschnitt der Portal-Tour auf 1080 × 1920, höchstens 30 s (Spec 2026-10-15 Produktmarke).
 *   npx tsx tour/zuschnitt.ts <eingang.webm> <schluessel>
 * ffmpeg: Umgebungsvariable FFMPEG, sonst das in Remotion mitgelieferte (@remotion/compositor-*).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** ffmpeg aus dem plattformspezifischen Remotion-Compositor-Paket (enthält libx264). */
function mitgeliefert(): string {
  const plattform: Record<string, string> = {
    win32: "win32-x64-msvc",
    darwin: process.arch === "arm64" ? "darwin-arm64" : "darwin-x64",
    linux: process.arch === "arm64" ? "linux-arm64-gnu" : "linux-x64-gnu",
  };
  const paket = join(dirname(fileURLToPath(import.meta.url)), "..");
  const pfad = join(paket, "node_modules", "@remotion", `compositor-${plattform[process.platform]}`, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (!existsSync(pfad)) throw new Error(`ffmpeg nicht gefunden (${pfad}); FFMPEG setzen`);
  return pfad;
}

export function zuschnitt(eingang: string, schluessel: string): string {
  if (!/^[a-z0-9-]{2,40}$/.test(schluessel)) throw new Error("schluessel: nur a-z, 0-9 und Bindestrich");
  mkdirSync("out", { recursive: true });
  const ziel = `out/bot-reel-tour-${schluessel}.mp4`;
  // Nichts wird beschnitten. Volles ffmpeg: jede Eingabe auf 1920 Höhe, seitlich auffüllen.
  // Das in Remotion mitgelieferte ffmpeg kennt weder pad noch overlay/color: dort nur
  // seitentreu einpassen; portal-tour.ts nimmt deshalb exakt 9:16 auf (432 × 768 → 1080 × 1920).
  const ff = process.env.FFMPEG ?? mitgeliefert();
  const filter = process.env.FFMPEG
    ? "scale=-2:1920,pad=1080:1920:(ow-iw)/2:0:color=0x0d1210"
    : "scale=1080:1920:force_original_aspect_ratio=decrease:force_divisible_by=2";
  const args = [
    "-y",
    "-i", eingang,
    "-vf", filter,
    "-t", "30",
    "-r", "30",
    "-an",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    ziel,
  ];
  // Direkt ohne Shell aufrufen, sonst zerlegt cmd.exe den Filter an den Klammern.
  const lauf = spawnSync(ff, args, { stdio: "inherit" });
  if (lauf.status !== 0) throw new Error(`ffmpeg endete mit ${lauf.status}`);
  return ziel;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("tour/zuschnitt.ts")) {
  const [eingang, schluessel] = process.argv.slice(2);
  if (!eingang || !schluessel) throw new Error("Aufruf: zuschnitt.ts <eingang.webm> <schluessel>");
  console.log(zuschnitt(eingang, schluessel));
}
