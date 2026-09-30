import { test } from "node:test";
import assert from "node:assert/strict";

import {
  blueteFreigabePruefen,
  blueteVorschlagPruefen,
  freigabeKonflikt,
  freigabeVorbelegen,
  quelleAlsLink,
  terpeneLesen,
  vorschlaegeBuendeln,
  type OffenerVorschlag,
} from "@/lib/vorschlag-eingabe";

const TERPENE = ["Myrcen", "Limonen", "Caryophyllen", "Linalool"];

function formular(werte: Record<string, string>) {
  return { get: (name: string) => werte[name] ?? null };
}

test("Vorschlag: nur Handelsname und Quelle sind Pflicht", () => {
  const e = blueteVorschlagPruefen(formular({ handelsname: " Apples & Bananas ", quelle: "Packung" }), TERPENE);
  assert.deepEqual(e, {
    ok: true,
    wert: {
      handelsname: "Apples & Bananas",
      schluessel: "apples-bananas",
      hersteller: null,
      kultivarName: null,
      kultivarTyp: null,
      thcProzent: null,
      cbdProzent: null,
      terpene: [],
      quelle: "Packung",
      notiz: null,
    },
  });
});

test("Vorschlag: fehlender Name, fehlende Quelle, leerer Slug", () => {
  assert.equal(blueteVorschlagPruefen(formular({ quelle: "x" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "A" }), TERPENE).ok, false);
  const leer = blueteVorschlagPruefen(formular({ handelsname: "&&&", quelle: "x" }), TERPENE);
  assert.deepEqual(leer, { ok: false, fehler: { schluessel: "vorschlag.nameOhneZeichen" } });
});

test("Vorschlag: Zahlen mit Komma, Grenzen, Kultivartyp", () => {
  const ok = blueteVorschlagPruefen(
    formular({ handelsname: "X", quelle: "q", thc: "22,5", cbd: "0", kultivarTyp: "HYBRID" }),
    TERPENE,
  );
  assert.equal(ok.ok && ok.wert.thcProzent, 22.5);
  assert.equal(ok.ok && ok.wert.cbdProzent, 0);
  assert.equal(ok.ok && ok.wert.kultivarTyp, "HYBRID");
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", thc: "41" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", cbd: "31" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", kultivarTyp: "LILA" }), TERPENE).ok, false);
});

test("Vorschlag: Terpene nur aus der Liste, Reihenfolge bleibt, Doppelte fallen weg", () => {
  const e = blueteVorschlagPruefen(
    formular({ handelsname: "X", quelle: "q", terpen1: "Limonen", terpen2: "Limonen", terpen3: "Myrcen" }),
    TERPENE,
  );
  assert.deepEqual(e.ok && e.wert.terpene, ["Limonen", "Myrcen"]);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", terpen1: "Gift" }), TERPENE).ok, false);
});

test("Vorschlag: Notiz zu lang wird abgelehnt", () => {
  const e = blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", notiz: "a".repeat(501) }), TERPENE);
  assert.equal(e.ok, false);
});

test("Freigabe: Pflichtfelder, Spannen, Slug aus dem korrigierten Namen", () => {
  const e = blueteFreigabePruefen(
    formular({
      vorschlagSchluessel: "apples-bananas",
      handelsname: "Apples and Bananas",
      kultivarTyp: "HYBRID",
      thc: "22,5",
      cbd: "0,8",
      terpen1: "Myrcen",
      bestrahlung: "UNBEKANNT",
    }),
    TERPENE,
  );
  assert.equal(e.ok, true);
  assert.equal(e.ok && e.wert.slug, "apples-and-bananas");
  assert.equal(e.ok && e.wert.vorschlagSchluessel, "apples-bananas");
  // Ein Wert je Cannabinoid: als min = max gespeichert (kein Schemawechsel).
  assert.deepEqual(e.ok && [e.wert.thcMin, e.wert.thcMax, e.wert.cbdMin, e.wert.cbdMax], [22.5, 22.5, 0.8, 0.8]);
  const ohneTyp = blueteFreigabePruefen(
    formular({ vorschlagSchluessel: "a", handelsname: "A", thc: "1", cbd: "0" }),
    TERPENE,
  );
  assert.equal(ohneTyp.ok, false);
  const basis = { vorschlagSchluessel: "a", handelsname: "A", kultivarTyp: "INDICA" };
  const ohneThc = blueteFreigabePruefen(formular({ ...basis, cbd: "0" }), TERPENE);
  assert.deepEqual(ohneThc, { ok: false, fehler: "THC: bitte einen Wert zwischen 0 und 100 % angeben." });
  const cbdZuHoch = blueteFreigabePruefen(formular({ ...basis, thc: "20", cbd: "101" }), TERPENE);
  assert.deepEqual(cbdZuHoch, { ok: false, fehler: "CBD: bitte einen Wert zwischen 0 und 100 % angeben." });
  // Alte Spannenfelder zaehlen nicht mehr.
  assert.equal(blueteFreigabePruefen(formular({ ...basis, thcMin: "20", thcMax: "24", cbdMin: "0", cbdMax: "1" }), TERPENE).ok, false);
  // Die Admin-Freigabe spricht weiter Deutsch, auch bei den gemeinsamen Namensfehlern.
  const ohneName = blueteFreigabePruefen(formular({ vorschlagSchluessel: "a", handelsname: "&&&" }), TERPENE);
  assert.deepEqual(ohneName, { ok: false, fehler: "Der Handelsname braucht Buchstaben oder Ziffern." });
});

function vorschlag(teil: Partial<OffenerVorschlag>): OffenerVorschlag {
  return {
    id: "v",
    mitgliedId: "m",
    anzeigename: "Mo",
    handelsname: "Apples & Bananas",
    schluessel: "apples-bananas",
    hersteller: null,
    kultivarName: null,
    kultivarTyp: null,
    thcProzent: null,
    cbdProzent: null,
    terpene: [],
    quelle: "Packung",
    notiz: null,
    erstelltAm: new Date("2026-09-20T10:00:00Z"),
    ...teil,
  };
}

test("vorschlaegeBuendeln: gleicher Schluessel eine Gruppe, aelteste Gruppe zuerst", () => {
  const gruppen = vorschlaegeBuendeln([
    vorschlag({ id: "1", schluessel: "b", erstelltAm: new Date("2026-09-22T00:00:00Z") }),
    vorschlag({ id: "2", schluessel: "apples-bananas", handelsname: "apples-bananas" }),
    vorschlag({ id: "3", schluessel: "apples-bananas", erstelltAm: new Date("2026-09-23T00:00:00Z") }),
  ]);
  assert.deepEqual(gruppen.map((g) => [g.schluessel, g.vorschlaege.map((v) => v.id)]), [
    ["apples-bananas", ["2", "3"]],
    ["b", ["1"]],
  ]);
});

test("freigabeVorbelegen: erster Vorschlag zuerst, Luecken aus den weiteren, Einzelwert bleibt ein Wert", () => {
  const belegung = freigabeVorbelegen({
    schluessel: "apples-bananas",
    vorschlaege: [
      vorschlag({ id: "1", thcProzent: 22 }),
      vorschlag({ id: "2", hersteller: "Aurora", kultivarTyp: "HYBRID", cbdProzent: 1, terpene: ["Myrcen"] }),
    ],
  });
  assert.deepEqual(belegung, {
    handelsname: "Apples & Bananas",
    kultivarName: "",
    kultivarTyp: "HYBRID",
    thc: "22",
    cbd: "1",
    hersteller: "Aurora",
    terpene: ["Myrcen"],
  });
});

test("freigabeKonflikt: fremde Id ist Konflikt, gleiche Id mit gleichem Namen oder nichts nicht", () => {
  assert.equal(freigabeKonflikt("id-a", "X", null), null);
  assert.equal(freigabeKonflikt("id-a", "X", { id: "id-a", slug: "x", handelsname: "X" }), null);
  assert.deepEqual(freigabeKonflikt("id-a", "A&B", { id: "id-b", slug: "apples-bananas", handelsname: "A&B" }), {
    slug: "apples-bananas",
    handelsname: "A&B",
  });
});

test("quelleAlsLink: nur http(s)", () => {
  assert.equal(quelleAlsLink("https://example.org/a"), "https://example.org/a");
  assert.equal(quelleAlsLink(" http://example.org "), "http://example.org/");
  assert.equal(quelleAlsLink("javascript:alert(1)"), null);
  assert.equal(quelleAlsLink("Packung"), null);
});

test("terpeneLesen: kaputtes JSON ergibt leere Liste", () => {
  assert.deepEqual(terpeneLesen('["Myrcen","Limonen"]'), ["Myrcen", "Limonen"]);
  assert.deepEqual(terpeneLesen("{kaputt"), []);
  assert.deepEqual(terpeneLesen(null), []);
  assert.deepEqual(terpeneLesen('[1,"Myrcen"]'), ["Myrcen"]);
});
