import { test } from "node:test";
import assert from "node:assert/strict";

import { notizKuerzen, reviewIdPruefen } from "@/lib/admin-eingabe";

test("reviewIdPruefen lehnt leere Ids ab und trimmt", () => {
  assert.deepEqual(reviewIdPruefen("  "), { ok: false, fehler: "Keine Bewertung angegeben." });
  assert.deepEqual(reviewIdPruefen(" abc "), { ok: true, wert: "abc" });
});

test("notizKuerzen: leer wird null, kurz bleibt, lang wird an Wortgrenze gekuerzt", () => {
  assert.equal(notizKuerzen(null), null);
  assert.equal(notizKuerzen("   "), null);
  assert.equal(notizKuerzen("kurz  und\ngut"), "kurz und gut");
  const lang = "wort ".repeat(50);
  const gekuerzt = notizKuerzen(lang, 20);
  assert.equal(gekuerzt, "wort wort wort wort…");
});
