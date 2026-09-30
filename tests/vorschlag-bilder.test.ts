import { test } from "node:test";
import assert from "node:assert/strict";

import { BUDPIC_MAX_BYTES } from "@/lib/budpics";
import { VORSCHLAG_MAX_BILDER, vorschlagBilderPruefen } from "@/lib/vorschlag-bilder";

function webp(breite: number, hoehe: number, laenge = 64): Uint8Array {
  const b = new Uint8Array(laenge);
  b.set([0x52, 0x49, 0x46, 0x46], 0);
  new DataView(b.buffer).setUint32(4, laenge - 8, true);
  b.set([0x57, 0x45, 0x42, 0x50], 8);
  b.set([0x56, 0x50, 0x38, 0x20], 12);
  b.set([0x9d, 0x01, 0x2a], 23);
  b[26] = breite & 0xff;
  b[27] = (breite >> 8) & 0x3f;
  b[28] = hoehe & 0xff;
  b[29] = (hoehe >> 8) & 0x3f;
  return b;
}

const datei = (bytes: Uint8Array, name = "b.webp") => new File([bytes as BlobPart], name, { type: "image/webp" });

test("ohne Bild ist kein Fehler: die Liste ist leer", async () => {
  assert.deepEqual(await vorschlagBilderPruefen([]), { ok: true, wert: [] });
  // Ein leeres Dateifeld des Browsers (Name leer, Groesse 0) zaehlt nicht als Bild.
  assert.deepEqual(await vorschlagBilderPruefen([new File([], "")]), { ok: true, wert: [] });
  assert.deepEqual(await vorschlagBilderPruefen(["text"]), { ok: true, wert: [] });
});

test("gueltige WebP-Dateien kommen mit Massen zurueck", async () => {
  const e = await vorschlagBilderPruefen([datei(webp(640, 480))]);
  assert.equal(e.ok, true);
  assert.equal(e.ok && e.wert.length, 1);
  assert.deepEqual(e.ok && [e.wert[0].breite, e.wert[0].hoehe], [640, 480]);
});

test("mehr als der Hoechstwert wird abgelehnt", async () => {
  const viele = Array.from({ length: VORSCHLAG_MAX_BILDER + 1 }, () => datei(webp(64, 64)));
  assert.deepEqual(await vorschlagBilderPruefen(viele), {
    ok: false,
    fehler: { schluessel: "vorschlag.zuVieleBilder", parameter: { max: VORSCHLAG_MAX_BILDER } },
  });
});

test("Nicht-Bild und zu grosse Datei werden vom Server abgelehnt", async () => {
  const text = new File([new TextEncoder().encode("kein Bild")], "x.webp", { type: "image/webp" });
  const e1 = await vorschlagBilderPruefen([text]);
  assert.equal(e1.ok, false);
  const gross = await vorschlagBilderPruefen([datei(webp(64, 64, BUDPIC_MAX_BYTES + 1))]);
  assert.deepEqual(gross, { ok: false, fehler: { schluessel: "bild.zuGross", parameter: { max: BUDPIC_MAX_BYTES / 1024 } } });
  const breit = await vorschlagBilderPruefen([datei(webp(1281, 100))]);
  assert.equal(breit.ok, false);
});
