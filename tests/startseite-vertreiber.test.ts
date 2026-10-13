import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { de } from "../lib/i18n/de";
import { en } from "../lib/i18n/en";

test("Startseite nennt Blüte und Vertreiber, nie mehr den Hersteller als Firma", () => {
  for (const datei of ["components/rangliste/RanglistenKarte.tsx", "components/story/AromaSektion.tsx"]) {
    const q = readFileSync(datei, "utf8");
    assert.doesNotMatch(q, /herstellerName|\.hersteller\b/, datei);
  }
  assert.match(readFileSync("components/rangliste/RanglistenKarte.tsx", "utf8"), /bluetenZeile/);
  assert.equal(de.rangliste.bluetenZeile, "{bluete} · {vertreiber}");
  assert.equal(en.rangliste.bluetenZeile, "{bluete} · {vertreiber}");
});
