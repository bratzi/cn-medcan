import { test } from "node:test";
import assert from "node:assert/strict";

import { HAUPTNAVIGATION, KONTO_LINK, istAktiv } from "@/lib/navigation";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Kern zuerst: Bewertungen, Abstimmung, Blüten; Apotheken nur in Aussicht", () => {
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.href),
    ["/reviews", "/umfragen", "/blueten"],
  );
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => de.kopf.navigation[eintrag.schluessel]),
    ["Bewertungen", "Abstimmung", "Blüten"],
  );
  assert.deepEqual(KONTO_LINK, { href: "/mitglied", schluessel: "konto" });
  assert.equal(de.kopf.navigation.konto, "Mein Konto");
  assert.equal(en.kopf.navigation.bewertungen, "Reviews");
});

test("istAktiv: die Seite selbst und ihre Unterseiten", () => {
  assert.equal(istAktiv("/blueten", "/blueten"), true);
  assert.equal(istAktiv("/blueten/nebelharz-22", "/blueten"), true);
});

test("istAktiv: kein Treffer über einen bloßen Namensanfang oder die Startseite", () => {
  assert.equal(istAktiv("/blueten-archiv", "/blueten"), false);
  assert.equal(istAktiv("/", "/reviews"), false);
  assert.equal(istAktiv("/reviews", "/umfragen"), false);
});

test("Kopf: Leiste erst ab lg, darunter Menüknopf mit Popover und Konto als Symbol", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { Kopf } = await import("@/components/layout/Kopf");
  const html = renderToStaticMarkup(createElement(Kopf, { sprache: "de", w: de }));
  assert.match(html, /lg:grid-cols-\[auto_1fr_auto]/);
  const leiste = html.match(/<nav aria-label="Hauptnavigation" class="([^"]*)"/)?.[1] ?? "";
  assert.match(leiste, /(^| )max-lg:hidden( |$)/);
  assert.match(html, /<button type="button" popoverTarget="kopf-menue" class="kopf-menue-knopf [^"]*lg:hidden">/i);
  assert.match(html, /<div id="kopf-menue" popover="auto"/);
  assert.match(html, /Menü öffnen/);
  assert.match(html, /class="max-lg:sr-only">Mein Konto/);
});

test("Kopf: Aktiv-Markierung am Wort, keine Kapitelnummern mehr", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { Kopf } = await import("@/components/layout/Kopf");
  const html = renderToStaticMarkup(createElement(Kopf, { sprache: "de", w: de }));
  // Stiftstrich (globals.css .kapitel-wort::after) sitzt am Wort; Nummern entfallen (Nutzer 2026-09-25).
  assert.match(html, /<span class="kapitel-wort">/);
  assert.doesNotMatch(html, /kapitel-nummer/);
});
