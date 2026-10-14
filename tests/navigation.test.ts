import { test } from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";

import { HAUPTNAVIGATION, PROFIL_LINK, istAktiv } from "@/lib/navigation";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Kern zuerst: Bewertungen, Abstimmung, Blüten; Profil als ein Knopf (Nutzer 2026-10-13)", () => {
  assert.deepEqual(HAUPTNAVIGATION.map((eintrag) => eintrag.href), ["/reviews", "/umfragen", "/blueten"]);
  assert.deepEqual(PROFIL_LINK, { href: "/profil", schluessel: "profil" });
  assert.equal(de.kopf.navigation.profil, "Mein Profil");
  assert.equal(en.kopf.navigation.profil, "My profile");
  assert.equal("konto" in de.kopf.navigation, false);
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

test("istAktiv: nur das eigene Profil, fremde Profile zählen nicht", () => {
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/profil/abc123", "/profil"), false);
  assert.equal(istAktiv("/mitglied", "/profil"), false);
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
  // Ein Knopf statt Profil und Konto (Nutzer 2026-10-13); ohne Sitzung „Mein Profil“.
  assert.match(html, /<span class="max-lg:sr-only inline-block max-w-28 truncate align-bottom ">Mein Profil<\/span>/);
  assert.doesNotMatch(html, /Mein Konto/);
  assert.equal((html.match(/href="\/profil"/g) ?? []).length, 2, "Knopf und Eintrag im Aufklappmenü");
});

test("Kopf: Menüknopf ist ab lg per CSS verborgen, nicht nur per Utility", async () => {
  // .kopf-menue-knopf { display: grid } steht ohne Layer und schlägt damit lg:hidden aus
  // @layer utilities (Nutzer 2026-09-29: Knopf erschien auf dem Desktop hinter dem Logo).
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  assert.match(css, /@media \(width >= 64rem\) \{[^}]*\.kopf-menue-knopf[^{]*\{\s*display: none;/);
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

test("istAktiv: fremdes öffentliches Profil markiert Profil nicht", () => {
  assert.equal(istAktiv("/profil/abcd2345", "/profil"), false);
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/blueten/x", "/blueten"), true);
});

test("Kopfknopf: langer Name wird gekürzt, voller Name bleibt lesbar (Review Focus)", () => {
  const q = readFileSync("components/layout/KontoZaehler.tsx", "utf8");
  assert.match(q, /max-w-28 truncate/);
  assert.match(q, /title=\{konto\.name \?\? undefined\}/);
  assert.match(q, /\{konto\.name \?\? beschriftung\}/);
  assert.match(q, /konto\.name \? "text-\[0\.6875rem\]"/);
});
