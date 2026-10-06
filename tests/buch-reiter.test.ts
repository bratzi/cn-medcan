import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BuchReiter, ReiterLeiste } from "@/components/review/BuchReiter";

const TITEL = "Terpenbewertung";
const karte = createElement("div", { "data-karte": "1" }, createElement(ReiterLeiste, { titel: TITEL }));

test("Reiter: mit nur einer Tafel steht deren Titel statt einer Leiste", () => {
  const html = renderToStaticMarkup(
    createElement(BuchReiter, { bezeichnung: "Werte", reiter: [{ schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true }] }),
  );
  assert.match(html, /<p class="text-small font-medium text-text">Terpenbewertung<\/p>/);
  assert.doesNotMatch(html, /role="tablist"/);
});

test("Reiter: mit mehreren Tafeln steht die Leiste an der Stelle des Titels", () => {
  const html = renderToStaticMarkup(
    createElement(BuchReiter, {
      bezeichnung: "Werte",
      reiter: [
        { schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true },
        { schluessel: "beschaffenheit", titel: "Beschaffenheit", inhalt: createElement("p", null, "B") },
      ],
    }),
  );
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Terpenbewertung</);
  const anfang = html.indexOf('data-karte="1"');
  const offen = html.slice(anfang, html.indexOf("</div>", anfang));
  assert.doesNotMatch(offen, /<p class="text-small font-medium text-text">/);
});
