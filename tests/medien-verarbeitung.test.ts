import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { waehleSdVideo, zuGraustufenWebp, zuStandbildWebp } from "../scripts/medien/verarbeitung";

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

test("Standbild wird ein Quadrat in der verlangten Kante", async () => {
  const quer = await sharp({ create: { width: 1280, height: 720, channels: 3, background: "#333" } }).jpeg().toBuffer();
  const meta = await sharp(await zuStandbildWebp(quer, 576)).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 576);
  assert.equal(meta.height, 576);
});
