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
  // Terpene sind seit 2026-10-03 an oder aus (Nutzer): die eingegebene Stufe 3 heißt "an".
  assert.deepEqual(e.wert.terpenIntensitaet, { Myrcen: 1 });
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

test("jede Ablehnung nennt einen Meldungsschluessel, den das Woerterbuch kennt", async () => {
  const { de } = await import("@/lib/i18n/de");
  const { en } = await import("@/lib/i18n/en");
  const faelle = [
    formular({ strainId: "" }),
    formular({ chargenNr: "<b>" }),
    formular({ "note-wirkung": "" }),
    formular({ feuchtigkeit: "45" }),
    formular({ "geschmack-zitrus": "3.3" }),
    formular({ "terpen-Myrcen": "6" }),
    formular({ "beschaffenheit-budDichte": "9" }),
    formular({ notiz: "x".repeat(5000) }),
    formular({ instagramReelUrl: "https://example.com/x" }),
  ];
  for (const f of faelle) {
    const e = bewertungPruefen(f, ["Myrcen"]);
    assert.equal(e.ok, false);
    if (e.ok) continue;
    assert.ok(e.fehler.schluessel in de.meldung, e.fehler.schluessel);
    assert.ok(e.fehler.schluessel in en.meldung, e.fehler.schluessel);
  }
});

test("Terpene werden als an oder aus angenommen; alte Stufen gelten als an (Nutzer 2026-10-03)", () => {
  const felder = new Map<string, unknown>([
    ["strainId", "s1"],
    ["note-aussehen", "4"],
    ["note-geruch", "4"],
    ["note-geschmack", "4"],
    ["note-wirkung", "4"],
    ["note-konsistenz", "4"],
    ["terpen-Myrcen", "1"],
    ["terpen-Limonen", "0"],
    ["terpen-Humulen", "3"],
  ]);
  const ergebnis = bewertungPruefen({ get: (name) => felder.get(name) ?? null }, ["Myrcen", "Limonen", "Humulen"]);
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.deepEqual(ergebnis.wert.terpenIntensitaet, { Myrcen: 1, Limonen: 0, Humulen: 1 });
});
