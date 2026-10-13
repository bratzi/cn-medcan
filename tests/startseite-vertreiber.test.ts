import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KapitelAufschlag, kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { bluetenZeile } from "@/lib/bluete-zeile";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { kapitelAus, type KapitelDaten } from "@/lib/kapitel-start";

test("Startseite nennt Blüte und Vertreiber, nie mehr den Hersteller als Firma", () => {
  for (const datei of ["components/rangliste/RanglistenKarte.tsx", "components/story/AromaSektion.tsx"]) {
    const q = readFileSync(datei, "utf8");
    assert.doesNotMatch(q, /herstellerName|\.hersteller\b/, datei);
  }
  for (const datei of ["components/rangliste/RanglistenKarte.tsx", "components/kapitel-start/KapitelAufschlag.tsx", "components/review/BuchDoppelseite.tsx"]) {
    assert.match(readFileSync(datei, "utf8"), /bluetenZeile/, datei);
  }
  assert.equal(de.start.bluetenZeile, "{bluete} · {vertreiber}");
  assert.equal(en.start.bluetenZeile, "{bluete} · {vertreiber}");
});

test("bluetenZeile: Vertreiber fehlt -> unbekannt, Kultivar fehlt -> Handelsname", () => {
  const v = de.start.bluetenZeile;
  const u = de.bluete.vertreiber.unbekannt;
  assert.equal(bluetenZeile(v, u, { handelsname: "Remexian 30/1", bluete: "Remexian", vertreiber: "Purplefarm" }), "Remexian · Purplefarm");
  assert.equal(bluetenZeile(v, u, { handelsname: "Remexian 30/1", bluete: "Remexian", vertreiber: null }), `Remexian · ${u}`);
  assert.equal(bluetenZeile(v, u, { handelsname: "Remexian 30/1", vertreiber: "Purplefarm" }), "Remexian 30/1 · Purplefarm");
});

const basis = {
  anzeigename: "Wal",
  avatarId: null,
  bewertet: 1,
  schnitt: 4.5,
  dritte: { art: "vonEuch" as const, zahl: 0 },
  netz: null,
};
const erstellt = new Date("2026-10-08T10:00:00Z");

test("kapitelAus trägt Blüte und Vertreiber, mit Rückfall", () => {
  const voll = kapitelAus({ ...basis, zuletzt: { slug: "r", handelsname: "Remexian 30/1", bluete: "Remexian", vertreiber: "Purplefarm", gesamtnote: 4, erstelltAm: erstellt } });
  assert.equal(voll.zuletzt?.bluete, "Remexian");
  assert.equal(voll.zuletzt?.vertreiber, "Purplefarm");
  const ohne = kapitelAus({ ...basis, zuletzt: { slug: "r", handelsname: "Remexian 30/1", gesamtnote: 4, erstelltAm: erstellt } });
  assert.equal(ohne.zuletzt?.bluete, "Remexian 30/1");
  assert.equal(ohne.zuletzt?.vertreiber, null);
});

function zeige(d: KapitelDaten): string {
  return renderToStaticMarkup(createElement(KapitelAufschlag, { daten: d, art: "schaufenster", texte: kapitelTexte(de), sprache: "de" }));
}

test("Kapitel zeigt die Zeile; Vertreiber null -> unbekannt", () => {
  const d = kapitelAus({ ...basis, zuletzt: { slug: "r", handelsname: "Remexian 30/1", bluete: "Remexian", vertreiber: "Purplefarm", gesamtnote: 4, erstelltAm: erstellt } });
  assert.match(zeige(d), /Remexian · Purplefarm/);
  const keiner = { ...d, zuletzt: { ...d.zuletzt!, vertreiber: null } };
  assert.match(zeige(keiner), new RegExp(`Remexian · ${de.bluete.vertreiber.unbekannt}`));
});

test("alte gemerkte KapitelDaten ohne die neuen Felder rendern weiter", () => {
  const alt = JSON.parse(
    JSON.stringify(kapitelAus({ ...basis, zuletzt: { slug: "r", handelsname: "Remexian 30/1", gesamtnote: 4, erstelltAm: erstellt } })),
  ) as KapitelDaten;
  delete alt.zuletzt!.bluete;
  delete alt.zuletzt!.vertreiber;
  const html = zeige(alt);
  assert.match(html, new RegExp(`Remexian 30/1 · ${de.bluete.vertreiber.unbekannt}`));
});
