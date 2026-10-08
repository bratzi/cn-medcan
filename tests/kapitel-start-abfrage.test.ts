import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("lib/query/kapitel-start.ts", "utf8");
const route = readFileSync("app/api/startseite/route.ts", "utf8");

test("Schaufenster nur aus öffentlichem, freigegebenem Betreiber-Profil", () => {
  const von = quelle.indexOf("export const ladeSchaufensterKapitel");
  // Nur bis zur nächsten Funktion: ladeEigenesKapitel darf das private Profil lesen.
  const teil = quelle.slice(von, quelle.indexOf("export async function ladeEigenesKapitel"));
  assert.match(teil, /rolle: "ADMIN"/);
  assert.match(teil, /profilOeffentlich: true/);
  assert.match(teil, /freigegeben: true/);
  // Netz nur aus dem öffentlichen Stand, nie aus dem privaten.
  assert.match(teil, /oeffentlicheWerte\(/);
  assert.doesNotMatch(teil, /profilAusDaten\(/);
});

test("Zählungen nur freigegeben und aktive Sorte", () => {
  assert.match(quelle, /freigegeben: true, strain: \{ aktiv: true \}/);
});

test("Eigenes Kapitel rechnet das Profil nicht neu (CPU-Limit)", () => {
  assert.doesNotMatch(quelle, /profilFortschreiben|aktuellesProfil/);
});

test("API: Kapitel-Fehler bricht die Sitzung nicht", () => {
  assert.match(route, /ladeEigenesKapitel\(mitglied\.mitgliedId\)\.catch\(/);
  assert.match(route, /kapitel,/);
});
