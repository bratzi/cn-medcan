import { test } from "node:test";
import assert from "node:assert/strict";
import { beitragPruefen, juryslug, sichtbar, TITEL_MAX } from "@/lib/jury";

const gut = { titel: "Gelato im Glas", anriss: "Süß und cremig.", text: "Riecht nach Beeren.", reviewId: null };

test("beitragPruefen: gültig, leer, zu lang, HWG", () => {
  assert.deepEqual(beitragPruefen(gut), []);
  assert.ok(beitragPruefen({ ...gut, titel: " " }).includes("titel.leer"));
  assert.ok(beitragPruefen({ ...gut, titel: "x".repeat(TITEL_MAX + 1) }).includes("titel.lang"));
  assert.ok(beitragPruefen({ ...gut, text: "" }).includes("text.leer"));
  assert.ok(beitragPruefen({ ...gut, text: "Hilft beim Einschlafen" }).includes("hwg"));
});

test("juryslug: Umlaute, Kollision", () => {
  assert.equal(juryslug("Süße Grüße!", () => false), "suesse-gruesse");
  const belegt = new Set(["gelato", "gelato-2"]);
  assert.equal(juryslug("Gelato", (s) => belegt.has(s)), "gelato-3");
});

test("sichtbar: Beitrag und Ausgabe müssen veröffentlicht sein", () => {
  assert.equal(sichtbar({ status: "VEROEFFENTLICHT", ausgabe: null }), true);
  assert.equal(sichtbar({ status: "VEROEFFENTLICHT", ausgabe: { status: "ENTWURF" } }), false);
  assert.equal(sichtbar({ status: "EINGEREICHT", ausgabe: null }), false);
});
