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
  assert.deepEqual(KONTO_LINK, { href: "/profil", schluessel: "konto" });
  assert.equal(de.kopf.navigation.konto, "Mein Profil");
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
  assert.match(html, /class="max-lg:sr-only">Mein Profil/);
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

test("istAktiv: Mein Profil gilt auch auf dem Reiter Konto", () => {
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/mitglied", "/profil"), true);
  assert.equal(istAktiv("/mitglied-x", "/profil"), false);
  assert.equal(istAktiv("/mitglied", "/reviews"), false);
});

test("ProfilReiter: zwei Reiter, aktiver mit aria-current", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ProfilReiter } = await import("@/components/profil/ProfilReiter");
  const html = renderToStaticMarkup(createElement(ProfilReiter, { aktiv: "konto", texte: de.profil }));
  assert.match(html, /<nav aria-label="Profil und Konto"/);
  assert.match(html, /href="\/profil"[^>]*>Profil</);
  assert.match(html, /aria-current="page"[^>]*href="\/mitglied"|href="\/mitglied"[^>]*aria-current="page"/);
});

test("istAktiv: fremdes öffentliches Profil markiert Mein Profil nicht", () => {
  assert.equal(istAktiv("/profil/abcd2345", "/profil"), false);
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/mitglied", "/profil"), true);
  assert.equal(istAktiv("/blueten/x", "/blueten"), true);
});
