import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import sharp from "sharp";

import { icoAusPngs } from "../scripts/marke/ico";

async function quadrat(kante: number): Promise<Buffer> {
  return sharp({ create: { width: kante, height: kante, channels: 4, background: "#853dc2" } }).png().toBuffer();
}

test("ICO-Container: Kopf, Verzeichnis, PNG-Daten in Reihenfolge", async () => {
  const gross = await quadrat(32);
  const klein = await quadrat(16);
  const ico = icoAusPngs([
    { kante: 32, png: gross },
    { kante: 16, png: klein },
  ]);
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  assert.deepEqual([ico[6], ico[7], ico.readUInt16LE(10), ico.readUInt16LE(12)], [32, 32, 1, 32]);
  assert.equal(ico.readUInt32LE(14), gross.length);
  assert.equal(ico.readUInt32LE(18), 6 + 2 * 16);
  assert.deepEqual([ico[22], ico[23]], [16, 16]);
  assert.equal(ico.readUInt32LE(30), klein.length);
  assert.equal(ico.readUInt32LE(34), 6 + 2 * 16 + gross.length);
  assert.deepEqual(ico.subarray(38, 38 + gross.length), gross);
  assert.equal(ico.length, 38 + gross.length + klein.length);
});

test("ICO: Kante 256 steht als 0 im Verzeichnis, größere werden abgelehnt", async () => {
  const ico = icoAusPngs([{ kante: 256, png: await quadrat(1) }]);
  assert.deepEqual([ico[6], ico[7]], [0, 0]);
  assert.throws(() => icoAusPngs([{ kante: 512, png: Buffer.alloc(1) }]), /256/);
});

test("Schrift der Marke liegt mit Lizenz im Repo", () => {
  assert.equal(readFileSync("assets/marke/Inspiration-Regular.ttf").readUInt32BE(0), 0x00010000);
  assert.match(readFileSync("assets/marke/OFL.txt", "utf8"), /SIL OPEN FONT LICENSE/i);
});

test("Signet liegt in allen Größen vor (Spec TP3 6)", async () => {
  const soll = [
    ["app/icon.png", 512],
    ["app/apple-icon.png", 180],
    ["assets/marke/signet-1080.png", 1080],
  ] as const;
  for (const [datei, kante] of soll) {
    const meta = await sharp(readFileSync(datei)).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["png", kante, kante], datei);
  }
  const ico = readFileSync("app/favicon.ico");
  assert.equal(ico.readUInt16LE(4), 2);
  assert.deepEqual([ico[6], ico[22]], [32, 16]);
});
