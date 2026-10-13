import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { blueteFreigabePruefen, blueteVorschlagPruefen, vertreiberRolleNachFreigabe } from "@/lib/vorschlag-eingabe";

const vorschlagPruefen = (f: FormData) => blueteVorschlagPruefen(f, ["Myrcen"]);
const KULTIVAR = "4a5761be-5783-43ea-8223-a9e58cc75af8";

const formular = (felder: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(felder)) f.set(k, v);
  return f;
};

test("Vorschlag: Vertreiber und Hersteller getrennt, Kultivar-Id aus dem Link", () => {
  const e = vorschlagPruefen(formular({ handelsname: "Citrus Sprizz 25/1", vertreiber: "Remexian", hersteller: "", kultivarId: KULTIVAR, quelle: "Apotheke" }));
  assert.equal(e.ok, true);
  if (!e.ok) return;
  assert.equal(e.wert.vertreiber, "Remexian");
  assert.equal(e.wert.hersteller, null);
  assert.equal(e.wert.kultivarId, KULTIVAR);
});

test("Vorschlag: kaputte Kultivar-Id fällt weg", () => {
  const e = vorschlagPruefen(formular({ handelsname: "X", kultivarId: "<x>", quelle: "Apotheke" }));
  assert.equal(e.ok && e.wert.kultivarId, null);
});

test("Freigabe: Vertreiber, Hersteller und Kultivar-Id kommen durch", () => {
  const e = blueteFreigabePruefen(
    formular({ vorschlagSchluessel: "x", handelsname: "X", kultivarTyp: "HYBRID", thc: "20", cbd: "1", vertreiber: "Remexian", hersteller: "Aphria", kultivarId: KULTIVAR.toUpperCase() }),
    ["Myrcen"],
  );
  assert.equal(e.ok, true);
  if (!e.ok) return;
  assert.equal(e.wert.vertreiber, "Remexian");
  assert.equal(e.wert.hersteller, "Aphria");
  assert.equal(e.wert.kultivarId, KULTIVAR);
});

test("Vertreiber-Rolle: Hersteller wird BEIDES, Importeur und BEIDES bleiben", () => {
  assert.equal(vertreiberRolleNachFreigabe("HERSTELLER"), "BEIDES");
  assert.equal(vertreiberRolleNachFreigabe("IMPORTEUR"), null);
  assert.equal(vertreiberRolleNachFreigabe("BEIDES"), null);
});

test("Freigabe legt Kultivar an und setzt vertreiberId", () => {
  const q = readFileSync("app/[lang]/admin/vorschlag-aktionen.ts", "utf8");
  assert.match(q, /kultivarSichern\(/);
  assert.match(q, /vertreiberId/);
});
