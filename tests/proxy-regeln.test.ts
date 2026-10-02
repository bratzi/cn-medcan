import { test } from "node:test";
import assert from "node:assert/strict";

import { internerPfad, istApiPfad, istOhneGate, ohneSprachPraefix } from "@/lib/proxy-regeln";

test("Ohne Passwort: Login, Rechtsseiten, Sprachwechsel", () => {
  for (const pfad of ["/zugang", "/impressum", "/datenschutz", "/api/zugang", "/api/sprache"]) {
    assert.equal(istOhneGate(pfad), true, pfad);
  }
});

test("Alles andere liegt hinter dem Passwort, auch API, interne Pfade und Scanner-Pfade", () => {
  const geschuetzt = [
    "/",
    "/reviews",
    "/umfragen",
    "/blueten/x",
    "/mitglied",
    "/admin",
    "/api",
    "/api/startseite",
    "/api/benachrichtigungen",
    "/wp-login.php",
    "/zugangsdaten",
    "/de/impressum",
  ];
  for (const pfad of geschuetzt) assert.equal(istOhneGate(pfad), false, pfad);
});

test("API-Pfade: nur /api und darunter", () => {
  assert.equal(istApiPfad("/api"), true);
  assert.equal(istApiPfad("/api/startseite"), true);
  assert.equal(istApiPfad("/apotheken"), false);
  assert.equal(istApiPfad("/apix"), false);
  assert.equal(istApiPfad("/"), false);
});

test("Interner Pfad: Sprache als erstes Segment", () => {
  assert.equal(internerPfad("de", "/"), "/de");
  assert.equal(internerPfad("en", "/"), "/en");
  assert.equal(internerPfad("de", "/reviews"), "/de/reviews");
  assert.equal(internerPfad("en", "/blueten/amp-classic-25-1"), "/en/blueten/amp-classic-25-1");
  // Von außen aufgerufene interne Pfade gehen nicht durch, sie landen im 404.
  assert.equal(internerPfad("de", "/de/reviews"), "/de/de/reviews");
});

test("ohneSprachPraefix kehrt internerPfad um und lässt Wörter in Ruhe", () => {
  for (const sprache of ["de", "en"] as const) {
    for (const pfad of ["/", "/reviews", "/blueten/x"]) {
      assert.equal(ohneSprachPraefix(internerPfad(sprache, pfad)), pfad);
    }
  }
  assert.equal(ohneSprachPraefix("/denkmal"), "/denkmal");
  assert.equal(ohneSprachPraefix("/english"), "/english");
  assert.equal(ohneSprachPraefix("/reviews"), "/reviews");
  assert.equal(ohneSprachPraefix(""), "");
});
