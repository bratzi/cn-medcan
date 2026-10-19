import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ADMIN_BEREICHE } from "@/lib/admin-aufgaben";

test("Layout prüft Recht: Gast Redirect, Nicht-Admin notFound", () => {
  const q = readFileSync("app/[lang]/admin/layout.tsx", "utf8");
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fadmin"\)/);
  assert.match(q, /rolle !== "ADMIN"\) notFound\(\)/);
});

test("jede Unterseite existiert und prüft selbst (Layouts schützen keine parallelen Requests)", () => {
  for (const b of ADMIN_BEREICHE) {
    const pfad = `app/[lang]/admin/${b.id}/page.tsx`;
    assert.ok(existsSync(pfad), pfad);
    assert.match(readFileSync(pfad, "utf8"), /adminSeite\(|adminErforderlich\(/, pfad);
  }
});

test("Übersicht enthält keine Abschnitte mehr", () => {
  const q = readFileSync("app/[lang]/admin/page.tsx", "utf8");
  assert.doesNotMatch(q, /async function (MitgliederBereich|BewertungenBereich|BudpicListe)/);
});
