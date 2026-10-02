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
