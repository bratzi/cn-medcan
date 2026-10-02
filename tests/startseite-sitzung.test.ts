import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  eigeneStimmeAuf,
  empfehlungenAnzeige,
  sitzungsAntwort,
  stimmzettelAnzeige,
  type SitzungsStand,
  type StartseitenSitzung,
} from "@/lib/startseite-sitzung";

const LISTE = [{ slug: "a", handelsname: "A", begruendung: "weil dir B gefiel" }];
const fertig = (daten: StartseitenSitzung): SitzungsStand => ({ status: "fertig", daten });

test("Gäste: anonymer Stimmzettel, Gast-Empfehlungen, Gast-Zugang", () => {
  assert.deepEqual(sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] }), {
    abstimmung: { umfrageId: null, zustand: { art: "ANONYM" } },
    empfehlungen: { art: "GAST" },
    budpicZugang: "gast",
  });
});

test("Mitglied ohne Freischaltung: Freigabe offen, Liste, Zugang mitglied", () => {
  const antwort = sitzungsAntwort({ mitglied: { freigegeben: false }, umfrageId: "u1", eigeneOptionId: null, empfehlungen: LISTE });
  assert.deepEqual(antwort.abstimmung, { umfrageId: "u1", zustand: { art: "FREIGABE_OFFEN" } });
  assert.deepEqual(antwort.empfehlungen, { art: "LISTE", eintraege: LISTE });
  assert.equal(antwort.budpicZugang, "mitglied");
});

test("Freigeschaltet: stimmberechtigt oder abgestimmt, Zugang freigegeben", () => {
  const offen = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(offen.abstimmung.zustand, { art: "STIMMBERECHTIGT" });
  assert.equal(offen.budpicZugang, "freigegeben");
  const gewaehlt = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] });
  assert.deepEqual(gewaehlt.abstimmung.zustand, { art: "ABGESTIMMT", optionId: "o2" });
});

test("Stimmzettel: Laden, Fehler, Gast", () => {
  assert.equal(stimmzettelAnzeige({ status: "laedt" }, "u1"), "laedt");
  assert.equal(stimmzettelAnzeige({ status: "fehler" }, "u1"), "fehler");
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(gast), "u1"), "ANONYM");
});

test("Stimmzettel: gleiche Runde zeigt den Zustand, fremde oder keine Runde den Link zur Abstimmung", () => {
  const gewaehlt = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(gewaehlt), "u1"), "ABGESTIMMT");
  assert.equal(stimmzettelAnzeige(fertig(gewaehlt), "u0"), "veraltet");
  const ohneRunde = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(ohneRunde), "u1"), "veraltet");
});

test("Eigene Stimme nur auf der eigenen Option der gezeigten Runde", () => {
  const gewaehlt = fertig(sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] }));
  assert.equal(eigeneStimmeAuf(gewaehlt, "u1", "o2"), true);
  assert.equal(eigeneStimmeAuf(gewaehlt, "u1", "o3"), false);
  assert.equal(eigeneStimmeAuf(gewaehlt, "u0", "o2"), false);
  assert.equal(eigeneStimmeAuf({ status: "laedt" }, "u1", "o2"), false);
});

test("Empfehlungen: Laden, Fehler, Gast, leer, Liste", () => {
  assert.deepEqual(empfehlungenAnzeige({ status: "laedt" }), { art: "laedt" });
  assert.deepEqual(empfehlungenAnzeige({ status: "fehler" }), { art: "fehler" });
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(empfehlungenAnzeige(fertig(gast)), { art: "gast" });
  const leer = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(empfehlungenAnzeige(fertig(leer)), { art: "leer" });
  const voll = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: LISTE });
  assert.deepEqual(empfehlungenAnzeige(fertig(voll)), { art: "liste", eintraege: LISTE });
});

test("Endpunkt: privat, Gäste ohne Datenbank, Sprache aus der Anfrage", () => {
  const route = readFileSync("app/api/startseite/route.ts", "utf8");
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(route, /if \(!mitglied\) \{/);
  assert.ok(route.indexOf("if (!mitglied) {") < route.indexOf("aktiveUmfrageId()"));
  assert.match(route, /holeSpracheAusAnfrage\(\)/);
});
