import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seite = () => readFileSync("app/[lang]/profil/page.tsx", "utf8");

test("/profil: nur angemeldet, nicht im Index, rechnet nur bei veraltetem Stand", () => {
  const q = seite();
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fprofil"\)/);
  assert.match(q, /index: false/);
  assert.match(q, /aktuellesProfil\(/);
  const query = readFileSync("lib/query/profil.ts", "utf8");
  assert.match(query, /profilNeuRechnen\(/);
  assert.match(query, /await profilFortschreiben\(/);
});

test("/profil: Kapitel-Reihenfolge, Raster, kein Apothekenlink", () => {
  const q = seite();
  const reihe = [
    "<Kapitelkopf",
    "<Randnotizen",
    "<ProfilNetz",
    "<TerpenRangliste",
    "<EmpfehlungsListe",
    "<NetzVerlauf",
    "<Aktivitaet",
    "<NotenVerteilung",
    "<TopFlop",
    "<Lieblingshersteller",
    "<CommunityVergleich",
    "<Schnitte",
    "<BewertungsRegister",
  ].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.match(q, /<KapitelRaster/);
  assert.match(q, /<ViewTransition/);
  assert.match(q, /<Suspense/);
  assert.doesNotMatch(q, /apotheke/i);
  assert.doesNotMatch(q, /max-w-180/);
  // Seit 2026-10-09 (Nutzer) keine Reiter mehr: Profil und Konto sind eigene Seiten.
  assert.doesNotMatch(q, /ProfilReiter/);
  assert.match(q, /seite=\{texte\.reiterProfil\}/);
});

test("/profil: Kontur aus dem vorletzten Verlaufsschritt, nie auf dem öffentlichen Profil", () => {
  const q = seite();
  assert.match(q, /verlauf\.at\(-2\)/);
  assert.match(q, /vorher=\{/);
  const oeffentlich = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.doesNotMatch(oeffentlich, /vorher=|NetzVerlauf|Lieblingshersteller/);
});

test("/mitglied: Titel ist der Reiter Konto, h1 ist der Name im Kapitelkopf", () => {
  const q = readFileSync("app/[lang]/mitglied/page.tsx", "utf8");
  assert.match(q, /title: \(await holeWoerterbuch\(\)\)\.profil\.reiterKonto/);
  assert.match(q, /name=\{mitglied\.anzeigename\}/);
  assert.doesNotMatch(q, /kopf\.navigation\.konto/);
  assert.doesNotMatch(q, /ProfilReiter/);
  assert.match(q, /seite=\{w\.profil\.reiterKonto\}/);
});

test("/mitglied: erst Konto (Angaben, Avatar, Sichtbarkeit, Status, Nachrichten), dann Umfrage und Stimmen; ein Primärknopf", () => {
  const q = readFileSync("app/[lang]/mitglied/page.tsx", "utf8");
  const koerper = q.slice(q.indexOf("export default async function MitgliedPage"), q.indexOf("async function KopfBild"));
  const reihe = ["<Kapitelkopf", "<Notizen", "<ProfilFormular", "<AvatarFormular", "<ProfilSichtbarkeit", "<Status", "<ReiheNachrichten", "<ReiheUmfrage", "<ReiheStimmen"].map((s) =>
    koerper.indexOf(s),
  );
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  for (const s of ["<Randnotizen", "<UmfrageJetzt", "<MeineStimmen", "<GelesenMarkieren"]) assert.ok(q.includes(s), s);
  assert.doesNotMatch(q, /buttonKlassen\("primary"\)/, "die Primäraktion steht nur in UmfrageJetzt");
  assert.doesNotMatch(q, /max-w-180/);
  assert.match(q, /<KapitelRaster/);
});

test("/profil: ohne ladbaren Stand nie die Leerskizze, Name im Kopf", () => {
  const q = seite();
  assert.match(q, /const netzFehlt = profil === null && \(zeilen === null \|\| zeilen\.length > 0\);/);
  assert.match(q, /\{mitglied\.anzeigename\}/);
});

test("Startseite: unbestätigte Vorschläge tragen dieselbe Marke wie im Profil", () => {
  const q = readFileSync("app/api/startseite/route.ts", "utf8");
  assert.match(q, /e\.bestaetigt \? \{\} : \{ marke: w\.profil\.nichtBestaetigt \}/);
});

test("/profil: Terpene-Feld zeigt ohne Terpene den Leersatz und setzt ohneTitel; /profil/[kurzId] nicht", () => {
  const q = seite();
  assert.match(q, /werte\.terpene\.length === 0\s*\?\s*\(\s*<p className="max-w-\[68ch\] text-body text-text-muted">\{texte\.leer\}<\/p>/);
  assert.match(q, /<TerpenRangliste[^>]*ohneTitel/);
  const oeffentlich = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.doesNotMatch(oeffentlich, /ohneTitel/);
});

test("/profil: Kopfbild nimmt das eigene Bild der besten Bewertung über BudpicBild", () => {
  const q = seite();
  assert.match(q, /beste\?\.eigenesBild/);
  assert.match(q, /<BudpicBild[^>]*alt=""/);
});

test("Randnotizen und Vorhang: Wort bricht um, Schatten wird nicht abgeschnitten", () => {
  assert.match(readFileSync("components/kapitel/Randnotizen.tsx", "utf8"), /wrap-break-word hyphens-auto/);
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /@keyframes feld-vorhang \{\s*from \{\s*clip-path: inset\(-32px -32px 100% -32px\);\s*\}\s*to \{\s*clip-path: inset\(-32px\);/);
});
