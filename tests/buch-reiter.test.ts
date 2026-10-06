import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BuchReiter, ReiterLeiste } from "@/components/review/BuchReiter";

const TITEL = "Terpenbewertung";
const karte = createElement("div", { "data-karte": "1" }, createElement(ReiterLeiste, { titel: TITEL }));

const zwei = () =>
  renderToStaticMarkup(
    createElement(BuchReiter, {
      bezeichnung: "Werte",
      reiter: [
        { schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true },
        { schluessel: "beschaffenheit", titel: "Beschaffenheit", inhalt: createElement("p", null, "B") },
      ],
    }),
  );

test("Reiter: mit nur einer Tafel steht deren Titel statt einer Leiste", () => {
  const html = renderToStaticMarkup(
    createElement(BuchReiter, { bezeichnung: "Werte", reiter: [{ schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true }] }),
  );
  // Gedruckt wie ein offener Reiter: Haarlinie unter der Zeile, Tintenstrich unter dem Titel.
  assert.match(
    html,
    /<p data-register="titel" class="[^"]*\bborder-b border-border\b[^"]*"><span class="[^"]*\bborder-b-2\b[^"]*\bborder-text text-text\b[^"]*">Terpenbewertung<\/span><\/p>/,
  );
  assert.doesNotMatch(html, /role="tablist"/);
});

test("Reiter: mit mehreren Tafeln steht die Leiste an der Stelle des Titels", () => {
  const html = zwei();
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Terpenbewertung</);
  const anfang = html.indexOf('data-karte="1"');
  const offen = html.slice(anfang, html.indexOf("</div>", anfang));
  assert.doesNotMatch(offen, /data-register="titel"/);
});

test("Register statt Pillenleiste: Reiter stehen gedruckt auf einer Haarlinie, ohne Kasten und ohne Pille", () => {
  const html = zwei();
  const leiste = /<div role="tablist"[^>]*class="([^"]*)"/.exec(html);
  assert.ok(leiste, "tablist fehlt");
  assert.match(leiste[1], /\bborder-b border-border\b/);
  assert.doesNotMatch(leiste[1], /rounded-full|border-border-strong|\bbg-/);
  assert.match(leiste[1], /\bmax-lg:hidden\b/);
  const reiter = [...html.matchAll(/role="tab"[^>]*class="([^"]*)"/g)];
  assert.equal(reiter.length, 2);
  for (const [, klasse] of reiter) {
    assert.doesNotMatch(klasse, /rounded-full|\bbg-accent\b/);
    // Touch-Ziel 44 px, der Strich liegt genau auf der Haarlinie.
    assert.match(klasse, /\bh-11\b/);
    assert.match(klasse, /(^| )-mb-px\b/);
    assert.match(klasse, /\bborder-b-2\b/);
  }
});

test("Register: der offene Reiter trägt den grünen Strich und volle Tinte, die anderen sind leise", () => {
  const html = zwei();
  assert.match(html, /role="tab" aria-selected="true"[^>]*class="[^"]*\bborder-accent text-text\b[^"]*">Terpenbewertung</);
  assert.match(html, /role="tab" aria-selected="false"[^>]*class="[^"]*\bborder-transparent text-text-muted\b[^"]*">Beschaffenheit</);
});
