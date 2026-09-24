import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { waehleSdVideo, zuGraustufenWebp, zuMaskePng, zuStandbildWebp } from "../scripts/medien/verarbeitung";

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

test("Graustufen-WebP: heller Grund wird weiß, das Motiv bleibt dunkel", async () => {
  // 40 x 40, Grund hellgrau (210), in der Mitte ein schwarzes Quadrat.
  const pixel = Buffer.alloc(40 * 40, 210);
  for (let y = 15; y < 25; y++) for (let x = 15; x < 25; x++) pixel[y * 40 + x] = 0;
  const eingabe = await sharp(pixel, { raw: { width: 40, height: 40, channels: 1 } }).png().toBuffer();
  const { data, info } = await sharp(await zuGraustufenWebp(eingabe, 40)).grayscale().raw().toBuffer({ resolveWithObject: true });
  assert.ok(data[0] >= 250, `Grund ${data[0]}`);
  assert.ok(data[20 * info.width + 20] <= 10, `Motiv ${data[20 * info.width + 20]}`);
});

test("Graustufen-WebP: dunkler Grund bleibt unverändert hell", async () => {
  const dunkel = await sharp({ create: { width: 40, height: 40, channels: 3, background: { r: 80, g: 80, b: 80 } } }).png().toBuffer();
  const { data } = await sharp(await zuGraustufenWebp(dunkel, 40)).grayscale().raw().toBuffer({ resolveWithObject: true });
  assert.ok(Math.abs(data[0] - 80) <= 4, `Grund ${data[0]}`);
});

test("Maske wird auf 3:2 zugeschnitten", async () => {
  const hoch = await sharp({ create: { width: 300, height: 600, channels: 3, background: "#777" } }).png().toBuffer();
  const meta = await sharp(await zuMaskePng(hoch, 90)).metadata();
  assert.equal(meta.width, 90);
  assert.equal(meta.height, 60);
});

test("Maske hat höchstens 16 Deckkraftstufen", async () => {
  const verlauf = await sharp(Buffer.from(Array.from({ length: 256 }, (_, i) => i)), {
    raw: { width: 256, height: 1, channels: 1 },
  })
    .png()
    .toBuffer();
  const stufen = new Set(await alphaWerte(await zuMaskePng(verlauf, 256)));
  assert.ok(stufen.size <= 16, `${stufen.size} Stufen`);
  for (const wert of stufen) assert.equal(wert % 17, 0, `Stufe ${wert}`);
});

test("Standbild wird ein Quadrat in der verlangten Kante", async () => {
  const quer = await sharp({ create: { width: 1280, height: 720, channels: 3, background: "#333" } }).jpeg().toBuffer();
  const meta = await sharp(await zuStandbildWebp(quer, 576)).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 576);
  assert.equal(meta.height, 576);
});
