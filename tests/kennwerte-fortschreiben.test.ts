import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { aromaKennwerte, chargenKennwerte, kennwerteDaten } from "@/lib/kennwerte";

const ZEILEN = [
  { gesamtnote: 4, terpenIntensitaet: '{"Myrcen":3}', geschmacksMatrix: '{"ERDIG":4}', beschaffenheit: '{"chlorophyll":2.5}', feuchtigkeitProzent: 11 },
  { gesamtnote: 2, terpenIntensitaet: null, geschmacksMatrix: "{}", beschaffenheit: null, feuchtigkeitProzent: null },
];

test("kennwerteDaten: Aroma und Qualität aus denselben Zeilen", () => {
  const d = kennwerteDaten(ZEILEN);
  assert.equal(d.aroma.anzahl, 2);
  assert.equal(d.aroma.gesamtnoteMittel, 3);
  assert.equal(d.qualitaet.qualitaetMittel, 5);
  assert.equal(d.qualitaet.anzahl, 1);
});

test("aromaKennwerte: Aroma allein, für den Kultivar", () => {
  const a = aromaKennwerte(ZEILEN);
  assert.equal(a.anzahl, 2);
  assert.equal(a.gesamtnoteMittel, 3);
});

test("chargenKennwerte: Qualität allein, für den Vertreiber", () => {
  const q = chargenKennwerte(ZEILEN);
  assert.equal(q.qualitaetMittel, 5);
  assert.equal(q.anzahl, 1);
});

test("kennwerteFortschreiben schreibt Kultivar und Vertreiber, überspringt fehlenden Vertreiber", () => {
  const q = readFileSync("lib/kennwerte.ts", "utf8");
  assert.match(q, /kultivarKennwerte\.upsert/);
  assert.match(q, /vertreiberKennwerte\.upsert/);
  assert.match(q, /if \(strain\.vertreiberId\)/);
});

test("Admin-Aktion rechnet alle Kennwerte neu und prüft den Betreiber", () => {
  const q = readFileSync("app/[lang]/admin/aktionen.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function kennwerteNeuRechnen"));
  assert.match(teil, /kennwerteFortschreiben\(strainId\)/);
  assert.match(teil.slice(0, 400), /adminErforderlich\(|ADMIN/);
});

test("Admin-Aktion arbeitet in Stücken zu 5 und lädt am Ende neu", () => {
  const q = readFileSync("app/[lang]/admin/aktionen.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function kennwerteNeuRechnen"));
  assert.match(teil, /take: 5/);
  assert.match(teil, /strainId: \{ gt: nach \}/);
  assert.match(teil, /orderBy: \{ strainId: "asc" \}/);
  assert.match(teil, /return \{ ok: true, anzahl, weiter \}/);
  assert.match(teil, /finally \{[\s\S]*revalidiereSprachen/);
  const k = readFileSync("components/admin/KennwerteNeuKnopf.tsx", "utf8");
  assert.match(k, /while \(nach !== null\)/);
});
