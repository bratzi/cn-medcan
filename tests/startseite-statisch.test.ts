import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.3.
test("Stimmzettel der Startseite liest keine Sitzung", () => {
  assert.doesNotMatch(lies("components/story/Abstimmung.tsx"), /lib\/session|aktuellesMitglied|eigeneStimme|stimmZustand/);
  assert.match(lies("components/story/Abstimmung.tsx"), /zustand="im-browser"/);
});

test("Ein Abruf für alle Inseln, nur in StartSitzung", () => {
  assert.match(lies("components/story/StartSitzung.tsx"), /fetch\("\/api\/startseite"/);
  assert.doesNotMatch(lies("components/umfrage/StimmzettelImBrowser.tsx"), /fetch\(/);
  assert.match(lies("app/[lang]/page.tsx"), /<StartSitzung>/);
});

test("Abstimmen auf der Startseite lädt den Zustand neu statt der gecachten Seite", () => {
  assert.match(lies("components/umfrage/StimmFormular.tsx"), /if \(sitzung\) sitzung\.neuLaden\(\);\s*else router\.refresh\(\);/);
});

test("Zustände des Browser-Stimmzettels: laedt, fehler, veraltet", () => {
  const karte = lies("components/umfrage/UmfrageKarte.tsx");
  assert.match(karte, /laedt:\s*\(\s*<p aria-busy="true"[^>]*>\s*<span className="sr-only">\{w\.start\.skelett\.abstimmung\}<\/span>/);
  assert.match(karte, /fehler:\s*<p[^>]*>\{w\.start\.abstimmung\.fehler\}<\/p>/);
  assert.match(karte, /veraltet:\s*\(\s*<Link[^>]*href="\/umfragen"[^>]*>\s*\{w\.reviews\.zurAbstimmung\}\s*<\/Link>/);
  assert.match(lies("components/umfrage/StimmzettelImBrowser.tsx"), /varianten\[sitzung \? stimmzettelAnzeige\(sitzung\.stand, umfrageId\) : "laedt"\]/);
});

test("Empfehlungen und Katalog der Startseite lesen keine Sitzung und keinen Fachkreis", () => {
  for (const datei of ["components/story/Empfehlungen.tsx", "components/story/Katalog.tsx"]) {
    assert.doesNotMatch(lies(datei), /lib\/session|aktuellesMitglied|budpicZugang\(|istFachkreis|ladeEmpfehlungen/, datei);
  }
  assert.match(lies("components/story/Katalog.tsx"), /ladeStrainListe\(leererFilter\(\), false\)/);
  assert.match(lies("components/story/Katalog.tsx"), /zugang="im-browser"/);
  for (const datei of ["components/empfehlung/EmpfehlungenImBrowser.tsx", "components/produkt/BudpicBeitragenImBrowser.tsx"]) {
    assert.doesNotMatch(lies(datei), /fetch\(/, datei);
  }
});

test("Startseite nutzt den Rating-Code als Example, nicht als Anzeige (Nutzer 2026-10-03)", () => {
  const sektion = lies("components/story/AromaSektion.tsx");
  const erkundung = lies("components/review/AromaErkundung.tsx");
  assert.match(sektion, /modus="example"/);
  // Ein Baum, kein zweiter: der Modus steuert nur die versteckten Felder.
  assert.match(erkundung, /modus\?: "anzeige" \| "example" \| "maske"/);
  assert.match(erkundung, /const eingabe = modus !== "anzeige"/);
  assert.match(erkundung, /modus === "maske"/);
  assert.doesNotMatch(erkundung, /eingabe\?: boolean/);
});
