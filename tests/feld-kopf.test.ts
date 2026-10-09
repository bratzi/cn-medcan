import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FELD_SPALTEN, Feld } from "@/components/kapitel/Feld";

test("Feld mit Kopf: Buchschrift, betontes Wort in Handschrift, Schlagwort, mittig", () => {
  const html = renderToStaticMarkup(
    createElement(Feld, { id: "netz", titel: "Deine Aromen", spalten: 10, kopf: { vor: "Deine", betont: "Aromen", schlagwort: "was dir schmeckt" } }),
  );
  assert.match(html, /<h2[^>]*id="netz-titel"[^>]*font-buch[^>]*text-center/);
  assert.match(html, /<em class="farbverlauf hand-betont">Aromen<\/em>/);
  assert.match(html, /aria-hidden="true"[^>]*font-hand[^>]*>was dir schmeckt/);
  assert.match(html, /overflow-x-clip/);
});

test("Breite 5 vorhanden", () => {
  assert.equal(FELD_SPALTEN[5], "min-[1080px]:col-span-5");
});
