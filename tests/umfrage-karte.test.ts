import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "components/umfrage/UmfrageKarte.tsx"), "utf8");

test("Stimmbalken in Tinte, nicht in Blattgrün", () => {
  assert.doesNotMatch(QUELLE, /bg-accent\b/);
  assert.match(QUELLE, /bg-text\b/);
});

test("Begriffe: freigeschaltet statt Freigabe, Ich statt Betreiber", () => {
  assert.doesNotMatch(QUELLE, /Freigabe ausstehend|freigegebene Mitglieder|des Betreibers|Vom Betreiber/);
  assert.match(QUELLE, /Noch nicht freigeschaltet/);
});

test("nur noch der Stimmzettel, keine Karten-Variante", () => {
  assert.doesNotMatch(QUELLE, /darstellung|CardHeader|CardBody|CardFooter|<Card\b/);
});

test("Anmelden führt auf die Seite zurück, auf der der Stimmzettel steht", () => {
  assert.match(QUELLE, /%2Fumfragen/);
  assert.match(QUELLE, /#vorschlaege/);
});

test("Knöpfe mit 44 px", () => {
  assert.doesNotMatch(QUELLE, /buttonKlassen\("[a-z]+", "sm"\)/);
});

test("Formulare der Abstimmung sprechen in der Ich-Form", () => {
  for (const datei of ["components/umfrage/StimmFormular.tsx", "components/umfrage/VorschlagFormular.tsx"]) {
    assert.doesNotMatch(readFileSync(join(process.cwd(), datei), "utf8"), /Betreiber/, datei);
  }
});
