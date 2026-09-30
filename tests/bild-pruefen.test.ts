import { test } from "node:test";
import assert from "node:assert/strict";

import { bildPruefen, bildTyp } from "@/lib/bild-pruefen";

/** Kleinste gueltige Kopfzeilen; die Pruefung liest nur Kennung und Masse. */
function webpLossy(breite: number, hoehe: number, laenge = 64, riffLaenge = laenge - 8): Uint8Array {
  const b = new Uint8Array(laenge);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  new DataView(b.buffer).setUint32(4, riffLaenge, true);
  b.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  b.set([0x56, 0x50, 0x38, 0x20], 12); // "VP8 "
  b.set([0x9d, 0x01, 0x2a], 23);
  b[26] = breite & 0xff;
  b[27] = (breite >> 8) & 0x3f;
  b[28] = hoehe & 0xff;
  b[29] = (hoehe >> 8) & 0x3f;
  return b;
}

function png(breite: number, hoehe: number): Uint8Array {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  b.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(b.buffer).setUint32(16, breite);
  new DataView(b.buffer).setUint32(20, hoehe);
  return b;
}

test("bildTyp erkennt WebP, PNG und JPEG an den Kennbytes, nicht am Namen", () => {
  assert.equal(bildTyp(webpLossy(128, 128)), "webp");
  assert.equal(bildTyp(png(1, 1)), "png");
  assert.equal(bildTyp(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "jpeg");
});

test("bildTyp lehnt SVG, HEIC, Text und leere Daten ab", () => {
  assert.equal(bildTyp(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")), null);
  const heic = new Uint8Array(32);
  heic.set([0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 4); // ftypheic
  assert.equal(bildTyp(heic), null);
  assert.equal(bildTyp(new Uint8Array(0)), null);
});

test("ein 128 x 128 WebP unter dem Limit ist gueltig", () => {
  const erg = bildPruefen(webpLossy(128, 128), { maxBytes: 30 * 1024, breite: 128, hoehe: 128 });
  assert.deepEqual(erg, { ok: true, typ: "webp", breite: 128, hoehe: 128 });
});

test("zu grosse Datei wird mit Schluessel abgelehnt", () => {
  const erg = bildPruefen(webpLossy(128, 128, 30 * 1024 + 1), { maxBytes: 30 * 1024 });
  assert.equal(erg.ok, false);
  if (!erg.ok) assert.equal(erg.fehler.schluessel, "bild.zuGross");
});

test("Nicht-Bild und PNG (nur WebP erlaubt) werden abgelehnt", () => {
  const text = bildPruefen(new TextEncoder().encode("hallo"), { maxBytes: 1024 });
  assert.equal(text.ok, false);
  if (!text.ok) assert.equal(text.fehler.schluessel, "bild.keinBild");
  const p = bildPruefen(png(128, 128), { maxBytes: 1024 });
  assert.equal(p.ok, false);
});

test("falsche Masse werden abgelehnt", () => {
  const erg = bildPruefen(webpLossy(200, 128), { maxBytes: 30 * 1024, breite: 128, hoehe: 128 });
  assert.equal(erg.ok, false);
  if (!erg.ok) assert.equal(erg.fehler.schluessel, "bild.masse");
});

test("PNG ist nur zugelassen, wenn der Aufrufer es erlaubt", () => {
  const erg = bildPruefen(png(64, 32), { maxBytes: 1024, erlaubt: ["webp", "png"] });
  assert.deepEqual(erg, { ok: true, typ: "png", breite: 64, hoehe: 32 });
});

test("stimmt die RIFF-Laenge nicht mit der Dateilaenge, ist das Bild abgeschnitten oder gefaelscht", () => {
  for (const riff of [10, 1000]) {
    const erg = bildPruefen(webpLossy(128, 128, 64, riff), { maxBytes: 1024 });
    assert.equal(erg.ok, false, `RIFF-Laenge ${riff}`);
    if (!erg.ok) assert.equal(erg.fehler.schluessel, "bild.keinBild");
  }
});

test("hoechstens-Masse: 1280 x 960 ist erlaubt, 1281 breit oder 1281 hoch nicht", () => {
  const opt = { maxBytes: 150 * 1024, maxBreite: 1280, maxHoehe: 1280 };
  assert.equal(bildPruefen(webpLossy(1280, 960), opt).ok, true);
  for (const [b, h] of [[1281, 100], [100, 1281]]) {
    const erg = bildPruefen(webpLossy(b, h), opt);
    assert.equal(erg.ok, false);
    if (!erg.ok) assert.equal(erg.fehler.schluessel, "bild.masse");
  }
});
