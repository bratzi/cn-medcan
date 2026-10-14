import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seite = () => readFileSync("app/[lang]/profil/page.tsx", "utf8");
// Seit 2026-10-13 stehen die Reihen in eigenen Dateien neben der Seite.
const reihen = () => readFileSync("app/[lang]/profil/profil-reihen.tsx", "utf8") + readFileSync("app/[lang]/profil/konto-reihen.tsx", "utf8");

test("/profil: nur angemeldet, nicht im Index, rechnet nur bei veraltetem Stand", () => {
  const q = seite();
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fprofil"\)/);
  assert.match(q, /index: false/);
  assert.match(readFileSync("app/[lang]/profil/laden.ts", "utf8"), /aktuellesProfil\(/);
  const query = readFileSync("lib/query/profil.ts", "utf8");
  assert.match(query, /profilNeuRechnen\(/);
  assert.match(query, /await profilFortschreiben\(/);
});

test("/profil: Bausteine, Streaming, kein Apothekenlink", () => {
  const q = seite() + reihen();
  for (const teil of ["<ProfilKopf", "<ProfilNetz", "<EmpfehlungsListe", "<Aktivitaet", "<NotenVerteilung", "<TopFlop", "<Lieblingsvertreiber", "<CommunityVergleich", "<Schnitte", "<BewertungsRegister"]) assert.ok(q.includes(teil), teil);
  assert.doesNotMatch(q, /<KapitelRaster|<Kapitelkopf|<ProfilReiter/);
  assert.match(seite(), /<Suspense/);
  assert.doesNotMatch(q, /apotheke/i);
  assert.doesNotMatch(q, /max-w-180/);
});

test("/profil: Verlauf im Netz statt in eigenem Feld, nie auf dem öffentlichen Profil (Nutzer 2026-10-09)", () => {
  const q = reihen();
  assert.match(q, /verlauf=\{verlauf\}/);
  assert.doesNotMatch(q, /NetzVerlauf|id="verlauf"/);
  assert.match(q, /<Feld id="aehnliches"/);
  const oeffentlich = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.doesNotMatch(oeffentlich, /verlauf=|NetzVerlauf|Lieblingsvertreiber/);
});

test("/profil: ohne ladbaren Stand nie die Leerskizze, Name im Kopf", () => {
  assert.match(seite(), /name: mitglied\.anzeigename/);
  const q = reihen();
  assert.match(q, /const netzFehlt = profil === null && \(zeilen === null \|\| zeilen\.length > 0\);/);
});

test("Startseite: unbestätigte Vorschläge tragen dieselbe Marke wie im Profil", () => {
  const q = readFileSync("app/api/startseite/route.ts", "utf8");
  assert.match(q, /e\.bestaetigt \? \{\} : \{ marke: w\.profil\.nichtBestaetigt \}/);
});

test("/profil: kein Feld Terpene mehr, die Terpene stecken im Netz (Nutzer 2026-10-09)", () => {
  const q = seite();
  assert.doesNotMatch(q, /id="terpene"|TerpenRangliste/);
  const oeffentlich = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.doesNotMatch(oeffentlich, /TerpenRangliste/);
});

test("Randnotizen und Vorhang: Wort bricht um, Schatten wird nicht abgeschnitten", () => {
  assert.match(readFileSync("components/kapitel/Randnotizen.tsx", "utf8"), /wrap-break-word hyphens-auto/);
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /@keyframes feld-vorhang \{\s*from \{\s*clip-path: inset\(-32px -32px 100% -32px\);\s*\}\s*to \{\s*clip-path: inset\(-32px\);/);
});
