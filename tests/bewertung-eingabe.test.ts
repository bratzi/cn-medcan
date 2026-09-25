import { test } from "node:test";
import assert from "node:assert/strict";

import { bewertungPruefen } from "@/lib/bewertung-eingabe";

function formular(werte: Record<string, string>) {
  const basis: Record<string, string> = {
    strainId: "s1",
    "note-aussehen": "4",
    "note-geruch": "5",
    "note-geschmack": "4",
    "note-wirkung": "3",
    "note-konsistenz": "4",
    "geschmack-zitrus": "3.5",
    ...werte,
  };
  return { get: (name: string) => basis[name] ?? null };
}

test("gültige Eingabe: Noten, Matrix mit Nullen, nur bekannte Terpene", () => {
  const e = bewertungPruefen(formular({ "terpen-Myrcen": "3", "terpen-Fremd": "5", feuchtigkeit: "10,5" }), ["Myrcen"]);
  assert.ok(e.ok);
  assert.equal(e.wert.noten.geruch, 5);
  assert.equal(e.wert.geschmacksMatrix.zitrus, 3.5);
  assert.equal(e.wert.geschmacksMatrix.diesel, 0);
  assert.deepEqual(e.wert.terpenIntensitaet, { Myrcen: 3 });
  assert.equal(e.wert.feuchtigkeitProzent, 10.5);
});

test("fehlende Note, falsche Stufe, kaputte Reel-URL werden abgewiesen", () => {
  assert.equal(bewertungPruefen(formular({ "note-wirkung": "" }), []).ok, false);
  assert.equal(bewertungPruefen(formular({ "geschmack-zitrus": "3.3" }), []).ok, false);
  assert.equal(bewertungPruefen(formular({ "terpen-Myrcen": "6" }), ["Myrcen"]).ok, false);
  assert.equal(bewertungPruefen(formular({ instagramReelUrl: "https://example.com/x" }), []).ok, false);
  assert.equal(bewertungPruefen(formular({ feuchtigkeit: "45" }), []).ok, false);
  assert.ok(bewertungPruefen(formular({ instagramReelUrl: "https://www.instagram.com/reel/AbC_12/" }), []).ok);
});

test("Beschaffenheit: nur bewegte Regler, 0 bis 5 in halben Schritten", () => {
  const e = bewertungPruefen(formular({ "beschaffenheit-budDichte": "4.5", "beschaffenheit-chlorophyll": "0" }), []);
  assert.ok(e.ok);
  if (e.ok) assert.deepEqual(e.wert.beschaffenheit, { chlorophyll: 0, budDichte: 4.5 });
  assert.equal(bewertungPruefen(formular({ "beschaffenheit-terpenDichte": "5.5" }), []).ok, false);
  assert.equal(bewertungPruefen(formular({ "beschaffenheit-trichomFarbe": "2.3" }), []).ok, false);
});
