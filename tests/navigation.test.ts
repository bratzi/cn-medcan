import { test } from "node:test";
import assert from "node:assert/strict";

import { HAUPTNAVIGATION, KONTO_LINK, istAktiv } from "@/lib/navigation";

test("Kern zuerst: Bewertungen, Abstimmung, Produkte, Apotheken", () => {
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.href),
    ["/reviews", "/umfragen", "/produkte", "/apotheken"],
  );
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.text),
    ["Bewertungen", "Abstimmung", "Produkte", "Apotheken"],
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
