import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingsvertreiber } from "@/components/profil/Lieblingsvertreiber";
import { de } from "@/lib/i18n/de";

test("ladeLieblingsvertreiber: nur eigene Bewertungen, begrenzt, Ersatznote", () => {
  const q = readFileSync("lib/query/lieblingsvertreiber.ts", "utf8");
  assert.match(q, /where: \{ autorId: mitgliedId \}/);
  assert.match(q, /take: /);
  assert.match(q, /qualitaetAusBeschaffenheit\(/);
});

test("Lieblingsvertreiber: ohne Daten (undefined) eine Fehlermeldung statt „noch keiner“", () => {
  const html = renderToStaticMarkup(createElement(Lieblingsvertreiber, { daten: undefined, texte: de.profil, sprache: "de" }));
  assert.match(html, /Deine Vertreiber lassen sich gerade nicht laden/);
  assert.doesNotMatch(html, /Sobald du eine Charge/);
});

test("ladeLieblingsvertreiber: neueste Bewertungen zuerst; die Seite unterscheidet Fehler von „keiner“", () => {
  const q = readFileSync("lib/query/lieblingsvertreiber.ts", "utf8");
  assert.match(q, /orderBy: \{ erstelltAm: "desc" \}/);
  const seite = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(seite, /ladeLieblingsvertreiber\(id\)\.catch\(\s*oderUndefined/);
});
