import { test } from "node:test";
import assert from "node:assert/strict";

import { HAUPTNAVIGATION, KONTO_LINK, istAktiv } from "@/lib/navigation";

test("Kern zuerst: Bewertungen, Abstimmung, Blüten, Apotheken", () => {
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.href),
    ["/reviews", "/umfragen", "/produkte", "/apotheken"],
  );
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.text),
    ["Bewertungen", "Abstimmung", "Blüten", "Apotheken"],
  );
  assert.deepEqual(KONTO_LINK, { href: "/mitglied", text: "Mein Konto" });
});

test("istAktiv: die Seite selbst und ihre Unterseiten", () => {
  assert.equal(istAktiv("/produkte", "/produkte"), true);
  assert.equal(istAktiv("/produkte/nebelharz-22", "/produkte"), true);
});

test("istAktiv: kein Treffer über einen bloßen Namensanfang oder die Startseite", () => {
  assert.equal(istAktiv("/produkte-archiv", "/produkte"), false);
  assert.equal(istAktiv("/", "/reviews"), false);
  assert.equal(istAktiv("/reviews", "/umfragen"), false);
});

test("Kopf: einzeilig erst ab lg, wo der Platz reicht; Leiste mit Luft für den Fokusring", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { Kopf } = await import("@/components/layout/Kopf");
  const html = renderToStaticMarkup(createElement(Kopf));
  assert.match(html, /lg:grid-cols-\[auto_1fr_auto_auto]/);
  assert.doesNotMatch(html, /md:grid-cols-\[auto_1fr_auto_auto]/);
  const leiste = html.match(/<ul class="([^"]*)"/)?.[1] ?? "";
  assert.match(leiste, /(^| )-my-2( |$)/);
  assert.match(leiste, /(^| )py-2( |$)/);
  assert.doesNotMatch(leiste, /lg:px-0|md:px-0/);
});

test("Kopf: Aktiv-Markierung nur am Wort, nicht an der Nummer", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { Kopf } = await import("@/components/layout/Kopf");
  const html = renderToStaticMarkup(createElement(Kopf));
  // Stiftstrich (globals.css .kapitel-wort::after) sitzt am Wort, die Nummer bleibt aria-hidden.
  assert.match(html, /<span class="kapitel-wort">/);
  assert.match(html, /<span aria-hidden="true" class="kapitel-nummer/);
});
