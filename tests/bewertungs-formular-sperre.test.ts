import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lies = (pfad: string) => readFileSync(join(process.cwd(), pfad), "utf8");
const FORMULAR = lies("components/review/BewertungsFormular.tsx");
const BILDER = lies("components/review/BewertungsBilder.tsx");

test("Formular: Absenden gesperrt, solange Bilder verkleinert werden", () => {
  assert.match(FORMULAR, /disabled=\{!hydriert \|\| laeuft \|\| verkleinert\}/);
  assert.match(FORMULAR, /onBeschaeftigt=\{setVerkleinert\}/);
});

test("Formular: Vorschauen beim Verlassen freigeben, Fortschritt als aria-live", () => {
  assert.match(FORMULAR, /vorgemerktStand\.current\.forEach/);
  assert.match(FORMULAR, /aria-live="polite"/);
});

test("Bilder: Wählen während des Verkleinerns gesperrt, Zustand per Funktion fortgeschrieben", () => {
  assert.match(BILDER, /disabled=\{!hydriert \|\| gesperrt \|\| verkleinert\}/);
  assert.match(BILDER, /setVorgemerkt\(\(vorher\) => \[\.\.\.vorher, \.\.\.neu\]\)/);
  assert.match(BILDER, /onBeschaeftigt\(true\)/);
});
