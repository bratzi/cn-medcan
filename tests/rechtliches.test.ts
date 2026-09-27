import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { istPlatzhalter, offeneAngaben, platzhalter, RECHTLICHE_LINKS } from "../lib/rechtliches";

const lesen = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

/** Das Matcher-Muster aus proxy.ts, so wie Next es statisch liest. */
function gateMuster(): RegExp {
  const treffer = lesen("proxy.ts").match(/matcher:\s*\[[\s\S]*?"(\/\(\(\?![^"]+)"/);
  assert.ok(treffer, "Matcher in proxy.ts nicht gefunden");
  return new RegExp(`^${treffer[1].replace(/\\\\/g, "\\")}$`);
}

test("Impressum und Datenschutz sind vom Passwort-Gate ausgenommen", () => {
  const muster = gateMuster();
  for (const pfad of ["/impressum", "/datenschutz", "/zugang"]) {
    assert.equal(muster.test(pfad), false, `${pfad} liegt hinter dem Gate`);
  }
  for (const pfad of ["/", "/reviews", "/mitglied", "/umfragen", "/admin"]) {
    assert.equal(muster.test(pfad), true, `${pfad} ist nicht mehr geschützt`);
  }
});

test("Fuß und Zugangsseite verlinken beide Seiten", () => {
  assert.deepEqual(
    RECHTLICHE_LINKS.map((l) => l.href),
    ["/impressum", "/datenschutz"],
  );
  for (const datei of ["components/layout/Fuss.tsx", "app/zugang/page.tsx"]) {
    assert.match(lesen(datei), /RECHTLICHE_LINKS\.map/, datei);
  }
});

test("fehlende Betreiberdaten bleiben sichtbare Platzhalter", () => {
  assert.equal(platzhalter("Ort"), "[BITTE ERGÄNZEN: Ort]");
  assert.equal(istPlatzhalter("[BITTE ERGÄNZEN: Ort]"), true);
  assert.equal(istPlatzhalter("Berlin"), false);
  assert.equal(istPlatzhalter(null), false);
  // Jede offene Angabe ist ein Platzhalter, keine erfundene Angabe.
  for (const wert of offeneAngaben()) assert.ok(wert.startsWith("[BITTE ERGÄNZEN:"), wert);
});

test("Rechtsseiten ohne Geviertstrich und ohne Gedankenstrich als Trenner", () => {
  for (const datei of ["app/impressum/page.tsx", "app/datenschutz/page.tsx", "lib/rechtliches.ts"]) {
    assert.doesNotMatch(lesen(datei), /—|\s–\s/, datei);
  }
});

test("Datenschutzerklärung nennt alle Cookies und Speicher, die der Code setzt", () => {
  const text = lesen("app/datenschutz/page.tsx");
  const gate = lesen("lib/gate.ts").match(/COOKIE_NAME = "([^"]+)"/)?.[1];
  const thema = lesen("lib/thema.ts").match(/THEMA_SCHLUESSEL = "([^"]+)"/)?.[1];
  const zaehler = lesen("components/layout/konto-zaehler-speicher.ts").match(/ZAEHLER_SPEICHER = "([^"]+)"/)?.[1];
  for (const name of [gate, thema, zaehler, "better-auth.session_token"]) {
    assert.ok(name && text.includes(`"${name}"`), `${name} fehlt in der Datenschutzerklärung`);
  }
});

test("Datenschutz beschreibt Instagram als Zwei-Klick-Lösung mit Einwilligung", () => {
  const text = lesen("app/datenschutz/page.tsx");
  assert.match(text, /Reel von Instagram laden/);
  assert.match(text, /Art\. 6 Abs\. 1 lit\. a DSGVO/);
  assert.match(text, /§ 25 Abs\. 1 TDDDG/);
  assert.doesNotMatch(text, /sobald du den Bereich/);
});
