import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Der Stimmzettel und sein Kandidat (seit TP3 eigene Datei, damit er ohne Server Action rendert). */
const QUELLE = ["components/umfrage/UmfrageKarte.tsx", "components/umfrage/Kandidat.tsx"]
  .map((datei) => readFileSync(join(process.cwd(), datei), "utf8"))
  .join("\n");

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

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

test("Phasennamen aus einer Quelle für Stimmzettel und Chronik", () => {
  assert.doesNotMatch(lies("app/umfragen/page.tsx"), /const PHASEN_LABEL/);
  assert.doesNotMatch(QUELLE, /const PHASEN_LABEL/);
  assert.match(lies("components/umfrage/phasen.ts"), /export const PHASEN_LABEL/);
});

test("Startseite spricht von freigeschalteten Mitgliedern", () => {
  assert.doesNotMatch(lies("components/story/Abstimmung.tsx"), /freigegebene Mitglieder/);
});

test("Formulare der Abstimmung: Hover über Fläche, Fokus über die globale Regel", () => {
  const stimme = lies("components/umfrage/StimmFormular.tsx");
  assert.doesNotMatch(stimme, /hover:opacity|duration-150/);
  assert.match(stimme, /hover:bg-surface-sunken/);
  assert.doesNotMatch(lies("components/umfrage/VorschlagFormular.tsx"), /focus-visible:outline/);
});

test("Lange Namen im gesetzten Platz und bei den Gewinnern brechen um", () => {
  assert.match(QUELLE, /namenLinkKlassen\("min-w-0 /);
  assert.match(lies("app/umfragen/page.tsx"), /<p className="text-body text-text wrap-break-word">\s*\{"Gewonnen: "\}/);
});

test("Stimmzettel auf derselben Ebene wie Doppelseite und Blatt", () => {
  assert.doesNotMatch(QUELLE, /shadow-lg/);
  assert.match(QUELLE, /stimmzettel border border-border-strong bg-surface-raised shadow-md/);
});

test("Startseite: Katalog-Leerzustand im Kasten wie seine Nachbarn", () => {
  assert.match(lies("components/story/Katalog.tsx"), /<EmptyState[\s\S]*?className="border border-border bg-surface-raised p-8 sm:p-12"/);
});
