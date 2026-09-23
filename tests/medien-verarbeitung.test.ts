import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { waehleSdVideo, zuGraustufenWebp, zuMaskePng } from "../scripts/medien/verarbeitung";

/** Ein Graustufenstreifen 4 x 1: schwarz, dunkelgrau, hellgrau, weiß. */
async function streifen(): Promise<Buffer> {
  return sharp(Buffer.from([0, 85, 170, 255]), { raw: { width: 4, height: 1, channels: 1 } })
    .png()
    .toBuffer();
}

async function alphaWerte(png: Buffer): Promise<number[]> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const werte: number[] = [];
  for (let i = 0; i < info.width * info.height; i++) werte.push(data[i * info.channels + 3]);
  return werte;
}

test("Maske: dunkle Farbe wird deckend, heller Grund durchsichtig", async () => {
  const alpha = await alphaWerte(await zuMaskePng(await streifen(), 4));
  assert.ok(alpha[0] > 200, `schwarz → ${alpha[0]}`);
  assert.ok(alpha[3] < 50, `weiß → ${alpha[3]}`);
  assert.ok(alpha[0] > alpha[1] && alpha[1] > alpha[2] && alpha[2] > alpha[3], alpha.join(","));
});

test("Maske umgekehrt: helle Farbe wird deckend", async () => {
  const alpha = await alphaWerte(await zuMaskePng(await streifen(), 4, true));
  assert.ok(alpha[3] > 200 && alpha[0] < 50, alpha.join(","));
});

test("Graustufen-WebP vergrößert nie", async () => {
  const klein = await sharp({ create: { width: 100, height: 50, channels: 3, background: "#4bc39f" } })
    .jpeg()
    .toBuffer();
  const meta = await sharp(await zuGraustufenWebp(klein, 640)).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 100);
});

test("Video: größte SD-Datei bis 960 px, sonst kleinste MP4", () => {
  const datei = (quality: string | null, width: number, file_type = "video/mp4") => ({
    quality,
    width,
    height: Math.round(width * 0.5625),
    file_type,
    link: `https://example.test/${quality}-${width}.mp4`,
  });
  assert.equal(
    waehleSdVideo([datei("hd", 1920), datei("sd", 640), datei("sd", 960), datei("sd", 426)])?.width,
    960,
  );
  assert.equal(waehleSdVideo([datei("hd", 1920), datei("hd", 1280)])?.width, 1280);
  assert.equal(waehleSdVideo([datei("sd", 640, "video/webm")]), null);
});
