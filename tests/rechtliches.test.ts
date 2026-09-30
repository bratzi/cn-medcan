import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  aufsichtFuer,
  AUFSICHTSBEHOERDEN,
  istPlatzhalter,
  ladeRechtliches,
  offeneAngaben,
  parseRechtliches,
  platzhalter,
  RECHTLICHE_LINKS,
} from "../lib/rechtliches";

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

const MUSTER = {
  name: "Erika Musterfrau",
  strasse: "Musterstraße 1",
  ort: "12345 Musterstadt",
  land: "Deutschland",
  email: "erika@example.com",
  telefon: "+49 123 4567890",
  bundesland: "Bayern",
};

test("Platzhalter sind als solche erkennbar", () => {
  assert.equal(platzhalter("Ort"), "[BITTE ERGÄNZEN: Ort]");
  assert.equal(istPlatzhalter("[BITTE ERGÄNZEN: Ort]"), true);
  assert.equal(istPlatzhalter("Berlin"), false);
  assert.equal(istPlatzhalter(null), false);
});

test("gültiges Secret liefert alle Felder, Privatperson ohne Register, USt-IdNr. und Vertretung", () => {
  const r = parseRechtliches(JSON.stringify(MUSTER));
  assert.equal(r.betreiber.name, "Erika Musterfrau");
  assert.equal(r.betreiber.strasse, "Musterstraße 1");
  assert.equal(r.betreiber.ort, "12345 Musterstadt");
  assert.equal(r.betreiber.land, "Deutschland");
  assert.equal(r.betreiber.email, "erika@example.com");
  assert.equal(r.betreiber.telefon, "+49 123 4567890");
  assert.equal(r.betreiber.register, null);
  assert.equal(r.betreiber.ustId, null);
  assert.equal(r.betreiber.vertretung, null);
  assert.equal(r.verantwortlich.name, "Erika Musterfrau");
  assert.equal(r.verantwortlich.anschrift, "Musterstraße 1, 12345 Musterstadt, Deutschland");
  assert.match(r.aufsicht.name, /BayLDA/);
  assert.deepEqual(offeneAngaben(r), []);
});

test("fehlendes Secret, kaputtes JSON oder Nicht-Objekt ergeben Platzhalter statt Fehler", () => {
  for (const json of [undefined, "", "{kaputt", "[]", "null", "42"]) {
    const r = parseRechtliches(json);
    for (const feld of ["name", "strasse", "ort", "land", "email", "telefon"] as const) {
      assert.equal(istPlatzhalter(r.betreiber[feld]), true, `${json}: ${feld}`);
    }
    assert.equal(istPlatzhalter(r.aufsicht.name), true);
    assert.equal(r.aufsicht.url, null);
    assert.equal(offeneAngaben(r).length > 0, true);
  }
});

test("fehlendes, leeres oder falsch getyptes Feld wird Platzhalter, die anderen bleiben", () => {
  const r = parseRechtliches(JSON.stringify({ ...MUSTER, telefon: "  ", email: 5 }));
  assert.equal(istPlatzhalter(r.betreiber.telefon), true);
  assert.equal(istPlatzhalter(r.betreiber.email), true);
  assert.equal(r.betreiber.name, "Erika Musterfrau");
  const ohneName: Partial<typeof MUSTER> = { ...MUSTER };
  delete ohneName.name;
  assert.equal(istPlatzhalter(parseRechtliches(JSON.stringify(ohneName)).betreiber.name), true);
});

test("Aufsichtsbehörde: 16 Länder, Bayern ist das BayLDA, Unbekanntes wird Platzhalter", () => {
  assert.equal(Object.keys(AUFSICHTSBEHOERDEN).length, 16);
  for (const [land, a] of Object.entries(AUFSICHTSBEHOERDEN)) {
    assert.match(a.url ?? "", /^https:\/\//, land);
    assert.doesNotMatch(a.name, /—|\s–\s/, land);
  }
  assert.match(aufsichtFuer("Bayern").name, /BayLDA/);
  assert.equal(aufsichtFuer(" nordrhein-westfalen ").url, "https://www.ldi.nrw.de");
  for (const unbekannt of ["Atlantis", "", undefined]) {
    const a = aufsichtFuer(unbekannt);
    assert.equal(istPlatzhalter(a.name), true);
    assert.equal(a.url, null);
  }
});

test("ladeRechtliches liest IMPRESSUM_JSON und stürzt ohne Secret nicht ab", async () => {
  const vorher = process.env.IMPRESSUM_JSON;
  try {
    process.env.IMPRESSUM_JSON = JSON.stringify(MUSTER);
    assert.deepEqual(offeneAngaben(await ladeRechtliches()), []);
    Reflect.deleteProperty(process.env, "IMPRESSUM_JSON");
    assert.equal(offeneAngaben(await ladeRechtliches()).length > 0, true);
  } finally {
    if (vorher === undefined) Reflect.deleteProperty(process.env, "IMPRESSUM_JSON");
    else process.env.IMPRESSUM_JSON = vorher;
  }
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
