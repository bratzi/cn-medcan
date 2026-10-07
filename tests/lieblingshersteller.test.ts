import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { de } from "@/lib/i18n/de";
import { lieblingshersteller } from "@/lib/lieblingshersteller";

test("lieblingshersteller: höchstes Mittel ab 2 eigenen Bewertungen", () => {
  const z = [
    { hersteller: "Aurora", note: 5 },
    { hersteller: "Tilray", note: 4 },
    { hersteller: "Tilray", note: 4.5 },
    { hersteller: "Bedrocan", note: 3 },
    { hersteller: "Bedrocan", note: 3.5 },
  ];
  assert.deepEqual(lieblingshersteller(z), { name: "Tilray", mittel: 4.3, anzahl: 2 });
});

test("lieblingshersteller: ohne Hersteller oder unter 2 Bewertungen keiner", () => {
  assert.equal(lieblingshersteller([{ hersteller: null, note: 5 }, { hersteller: null, note: 5 }, { hersteller: "A", note: 5 }]), null);
  assert.equal(lieblingshersteller([]), null);
});

test("lieblingshersteller: Gleichstand erst nach Anzahl, dann nach Name", () => {
  const z = [
    { hersteller: "B", note: 4 }, { hersteller: "B", note: 4 },
    { hersteller: "A", note: 4 }, { hersteller: "A", note: 4 },
    { hersteller: "C", note: 4 }, { hersteller: "C", note: 4 }, { hersteller: "C", note: 4 },
  ];
  assert.equal(lieblingshersteller(z)?.name, "C");
  assert.equal(lieblingshersteller(z.slice(0, 4))?.name, "A");
});

test("lieblingshersteller: gleicher Name mit Leerzeichen zählt zusammen", () => {
  assert.equal(lieblingshersteller([{ hersteller: "Aurora ", note: 4 }, { hersteller: "Aurora", note: 4 }])?.anzahl, 2);
});

test("Lieblingshersteller: Satz mit Komma-Note, sonst Hinweis", () => {
  const mit = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: { name: "Tilray", mittel: 4.3, anzahl: 2 }, texte: de.profil, sprache: "de" }));
  assert.match(mit, /Tilray: im Schnitt 4,3 von 5 aus 2 Bewertungen\./);
  const ohne = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: null, texte: de.profil, sprache: "de" }));
  assert.match(ohne, /Sobald du zwei Blüten desselben Herstellers/);
});

test("ladeLieblingshersteller: nur eigene Bewertungen, begrenzt, Ersatznote", () => {
  const q = readFileSync("lib/query/lieblingshersteller.ts", "utf8");
  assert.match(q, /where: \{ autorId: mitgliedId \}/);
  assert.match(q, /take: /);
  assert.match(q, /noteOderErsatz\(/);
});

test("Lieblingshersteller: ohne Daten (undefined) eine Fehlermeldung statt „noch keiner“", () => {
  const html = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: undefined, texte: de.profil, sprache: "de" }));
  assert.match(html, /Dein Lieblingshersteller lässt sich gerade nicht laden/);
  assert.doesNotMatch(html, /Sobald du zwei Blüten/);
});

test("ladeLieblingshersteller: neueste Bewertungen zuerst; die Seite unterscheidet Fehler von „keiner“", () => {
  const q = readFileSync("lib/query/lieblingshersteller.ts", "utf8");
  assert.match(q, /orderBy: \{ erstelltAm: "desc" \}/);
  const seite = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(seite, /ladeLieblingshersteller\(mitglied\.mitgliedId\)\.catch\(\s*oderUndefined/);
});
