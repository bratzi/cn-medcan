import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { ADMIN_BEREICHE } from "@/lib/admin-aufgaben";
import { herstellerPruefen } from "@/lib/hersteller-eingabe";

const formular = (felder: Record<string, string>) => {
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.set(k, v);
  return daten;
};

test("herstellerPruefen: gültige Eingabe, leere Felder werden null", () => {
  assert.deepEqual(
    herstellerPruefen(formular({ id: "u1", name: "  Aurora  ", website: "https://aurora.de/", logoPfad: "/marken/hersteller/aurora.svg" })),
    { ok: true, daten: { id: "u1", name: "Aurora", website: "https://aurora.de/", logoPfad: "/marken/hersteller/aurora.svg" } },
  );
  assert.deepEqual(herstellerPruefen(formular({ id: "u1", name: "Aurora", website: "", logoPfad: " " })), {
    ok: true,
    daten: { id: "u1", name: "Aurora", website: null, logoPfad: null },
  });
});

test("herstellerPruefen: lehnt fehlenden Namen, fremde Logos und Nicht-Web-Adressen ab", () => {
  assert.equal(herstellerPruefen(formular({ id: "u1", name: " " })).ok, false);
  assert.equal(herstellerPruefen(formular({ name: "Aurora" })).ok, false);
  assert.equal(herstellerPruefen(formular({ id: "u1", name: "Aurora", logoPfad: "https://fremd.example/x.svg" })).ok, false);
  assert.equal(herstellerPruefen(formular({ id: "u1", name: "Aurora", website: "javascript:alert(1)" })).ok, false);
  assert.equal(herstellerPruefen(formular({ id: "u1", name: "x".repeat(121) })).ok, false);
});

test("admin/hersteller: Bereich in der Leiste, Seite und Aktion prüfen das Recht selbst", () => {
  assert.ok(ADMIN_BEREICHE.some((b) => b.id === "hersteller"));
  const seite = "app/[lang]/admin/hersteller/page.tsx";
  assert.ok(existsSync(seite));
  assert.match(readFileSync(seite, "utf8"), /adminSeite\("\/admin\/hersteller"\)/);
  assert.match(readFileSync("app/[lang]/admin/hersteller-aktionen.ts", "utf8"), /await adminErforderlich\(\)/);
});
