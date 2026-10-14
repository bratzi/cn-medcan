import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("/reviews: Statistik zwischen Buch und Ranglisten, keine Wirkung", () => {
  const s = readFileSync("app/[lang]/reviews/seite.tsx", "utf8");
  const buch = s.indexOf("<GrossesBuch"), stat = s.indexOf("<BuchStatistik"), rang = s.indexOf("<Ranglisten");
  assert.ok(buch > 0 && stat > buch && rang > stat, `${buch} ${stat} ${rang}`);
  const k = readFileSync("components/review/BuchStatistik.tsx", "utf8");
  assert.doesNotMatch(k, /wirkung|Wirkung/);
  assert.match(k, /noch zu wenig|leer/i);
});
