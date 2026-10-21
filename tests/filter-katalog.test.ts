import assert from "node:assert/strict";
import { test } from "node:test";

import { aktiveRichtung, leererFilter, parseStrainFilter, serialisiereFilter, standardRichtung } from "@/lib/query/filter";

test("Filter: neue Parameter laufen hin und zurück", () => {
  const url = new URLSearchParams("note=4&bewertet=1&terp=Myrcen,Limonen&cbd=1&sortierung=stimmen&seite=2");
  const f = parseStrainFilter(url);
  assert.equal(f.note, 4);
  assert.equal(f.bewertet, true);
  assert.deepEqual(f.terp, ["Myrcen", "Limonen"]);
  assert.equal(f.cbd, true);
  assert.equal(f.sortierung, "stimmen");
  assert.equal(serialisiereFilter(f).toString(), url.toString());
});

test("Filter: ungültige Note und alte Sortierung fallen auf Standard", () => {
  const f = parseStrainFilter(new URLSearchParams("note=2&sortierung=relevanz"));
  assert.equal(f.note, undefined);
  assert.equal(f.sortierung, "relevanz");
  assert.equal(leererFilter().sortierung, "community");
  assert.equal(serialisiereFilter(leererFilter()).toString(), "");
});

test("Filter: Terpen-Namen nur aus sicheren Zeichen, höchstens 8", () => {
  const f = parseStrainFilter(new URLSearchParams("terp=Myrcen,<script>,a,b,c,d,e,f,g,h"));
  assert.ok(!f.terp.includes("<script>"));
  assert.ok(f.terp.length <= 8);
});

test("Richtung: richtung=auf|ab wird gelesen, sonst Standard je Sortierung", () => {
  assert.equal(parseStrainFilter(new URLSearchParams("richtung=auf")).richtung, "auf");
  assert.equal(parseStrainFilter(new URLSearchParams("richtung=ab")).richtung, "ab");
  assert.equal(parseStrainFilter(new URLSearchParams("richtung=quer")).richtung, undefined);
  assert.equal(leererFilter().richtung, undefined);
  assert.equal(standardRichtung("community"), "ab");
  assert.equal(standardRichtung("name"), "auf");
  assert.equal(standardRichtung("thc_aufsteigend"), "auf");
  assert.equal(aktiveRichtung({ ...leererFilter(), richtung: "auf" }), "auf");
  assert.equal(aktiveRichtung(leererFilter()), "ab");
});

test("Richtung: nur abweichend vom Standard in der URL", () => {
  assert.equal(serialisiereFilter({ ...leererFilter(), richtung: "auf" }).get("richtung"), "auf");
  assert.equal(serialisiereFilter({ ...leererFilter(), richtung: "ab" }).get("richtung"), null);
  assert.equal(serialisiereFilter({ ...leererFilter(), sortierung: "name", richtung: "ab" }).get("richtung"), "ab");
});
