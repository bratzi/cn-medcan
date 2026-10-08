import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { de } from "@/lib/i18n/de";

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
  assert.match(q, /<ProfilReiter\s+aktiv="profil"/);
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
});

test("/mitglied: Kapitel mit Umfrage, Stimmen, Nachrichten, dann Einstellungen; ein Primärknopf", () => {
  const q = readFileSync("app/[lang]/mitglied/page.tsx", "utf8");
  const koerper = q.slice(q.indexOf("export default async function MitgliedPage"), q.indexOf("async function KopfBild"));
  const reihe = ["<Kapitelkopf", "<Notizen", "<ReiheUmfrage", "<ReiheStimmen", "<ReiheNachrichten", "<AvatarFormular", "<ProfilFormular", "<ProfilSichtbarkeit"].map((s) =>
    koerper.indexOf(s),
  );
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  for (const s of ["<Randnotizen", "<UmfrageJetzt", "<MeineStimmen", "<GelesenMarkieren"]) assert.ok(q.includes(s), s);
  assert.doesNotMatch(q, /buttonKlassen\("primary"\)/, "die Primäraktion steht nur in UmfrageJetzt");
  assert.doesNotMatch(q, /max-w-180/);
  assert.match(q, /<KapitelRaster/);
});

test("ProfilReiter: ungelesene Benachrichtigungen am Reiter Konto, ohne keine Marke", () => {
  const mit = renderToStaticMarkup(
    createElement(ProfilReiter, { aktiv: "profil", texte: de.profil, ungelesen: { anzahl: 2, text: "2 ungelesene Benachrichtigungen" } }),
  );
  assert.ok(mit.indexOf("Konto") < mit.indexOf("2 ungelesene Benachrichtigungen"));
  const ohne = renderToStaticMarkup(createElement(ProfilReiter, { aktiv: "profil", texte: de.profil, ungelesen: { anzahl: 0, text: "x" } }));
  assert.doesNotMatch(ohne, /sr-only/);
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
