import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { de } from "@/lib/i18n/de";

test("ladeLieblingshersteller: nur eigene Bewertungen, begrenzt, Ersatznote", () => {
  const q = readFileSync("lib/query/lieblingshersteller.ts", "utf8");
  assert.match(q, /where: \{ autorId: mitgliedId \}/);
  assert.match(q, /take: /);
  assert.match(q, /noteOderErsatz\(/);
});

test("Lieblingshersteller: ohne Daten (undefined) eine Fehlermeldung statt „noch keiner“", () => {
  const html = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: undefined, texte: de.profil, sprache: "de" }));
  assert.match(html, /Deine Hersteller lassen sich gerade nicht laden/);
  assert.doesNotMatch(html, /Sobald du eine Blüte/);
});

test("ladeLieblingshersteller: neueste Bewertungen zuerst; die Seite unterscheidet Fehler von „keiner“", () => {
  const q = readFileSync("lib/query/lieblingshersteller.ts", "utf8");
  assert.match(q, /orderBy: \{ erstelltAm: "desc" \}/);
  const seite = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(seite, /ladeLieblingshersteller\(id\)\.catch\(\s*oderUndefined/);
});
