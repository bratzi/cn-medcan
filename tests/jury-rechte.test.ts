import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { darfBearbeiten, darfVerknuepfen } from "@/lib/jury-rechte";

const autor = { mitgliedId: "a", jury: true, rolle: "MITGLIED" };
test("darfBearbeiten", () => {
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, autor), true);
  assert.equal(darfBearbeiten({ autorId: "a", status: "EINGEREICHT" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, { ...autor, jury: false }), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "ENTWURF" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "VEROEFFENTLICHT" }, { mitgliedId: "x", jury: false, rolle: "ADMIN" }), true);
});
test("darfVerknuepfen: nur eigene, freigegebene Bewertung", () => {
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: true }, "a"), true);
  assert.equal(darfVerknuepfen({ autorId: "b", freigegeben: true }, "a"), false);
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: false }, "a"), false);
  assert.equal(darfVerknuepfen(null, "a"), false);
});

test("Upload lehnt über JURY_BILDER_MAX ab, bevor er schreibt", () => {
  const q = readFileSync("app/[lang]/admin/jury/aktionen.ts", "utf8");
  assert.ok(q.indexOf("anzahl >= JURY_BILDER_MAX") < q.indexOf("juryBild.create"));
  assert.match(q, /export async function juryBildHochladen[\s\S]*?await adminErforderlich\(\)/);
});
