import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BlueteKarte, StrainKarte, type KartenTexte } from "@/components/katalog/KatalogKarte";
import { de } from "@/lib/i18n/de";
import type { BlueteZeile, StrainZeile } from "@/lib/katalog/typen";

const karte = readFileSync("components/katalog/KatalogKarte.tsx", "utf8");
const TEXTE: KartenTexte = { ...de.katalog.karte, kultivarTyp: de.label.kultivarTyp, darreichungsform: de.label.darreichungsform };

/** Echte Kennwerte aus D1 („Apples & Bananas“, 2026-10-20); Top-Terpene Ocimen, Myrcen, alpha-Pinen. */
const APPLES_BANANAS = { diesel: 0, zitrus: 0.5, erdig: 3.25, suess: 4.5, wuerzig: 0.5, blumig: 0, holzig: 2.5, kraeutrig: 0.5, fruchtig: 0, minzig: 0 };

const BLUETE: BlueteZeile = {
  id: "k1", name: "Apples & Bananas", slug: "apples-bananas", typ: "HYBRID", thcMin: 24, thcMax: 27, cbdMax: 0.5,
  terpene: [{ name: "Ocimen", geschmack: "SUESS" }, { name: "Myrcen", geschmack: "ERDIG" }, { name: "alpha-Pinen", geschmack: "HOLZIG" }],
  vertreiberIds: ["u1"], handelsnamen: 2, community: { note: 4.1, stimmen: 123 }, geschmackMedian: APPLES_BANANAS,
  eigeneNote: null, letzteBewertung: null, bildSlug: null, herstellerBildPfad: null, suchtext: "", waren: [],
};

const STRAIN: StrainZeile = {
  i: "w1", s: "apples-bananas-27-1", h: "Apples & Bananas 27/1", k: "k1", y: "HYBRID", f: "BLUETE", g: null,
  t0: 24, t1: 27, c0: 0, c1: 0.5, v: "u1", b: null, tp: ["Ocimen", "Myrcen", "alpha-Pinen"], st: [], u: "2026-10-01T00:00:00Z",
  kultivarName: "Apples & Bananas", community: { note: 4.1, stimmen: 123 }, geschmackMedian: null,
  eigeneNote: null, letzteBewertung: null, terpenGeschmack: ["SUESS", "ERDIG", "HOLZIG"], suchtext: "",
};

const gemeinsam = { vertreiberName: () => "Alpha GmbH", texte: TEXTE, sprache: "de" as const, w: de };
const bluete = (zeile: BlueteZeile = BLUETE) => renderToStaticMarkup(createElement(BlueteKarte, { ...gemeinsam, zeile }));
const strain = (zeile: StrainZeile = STRAIN) => renderToStaticMarkup(createElement(StrainKarte, { ...gemeinsam, zeile, fachkreis: false }));

test("Karte: Name vor Bild, dann Community-Zeile, Geschmäcker, Fuß (Blüte und Strain)", () => {
  for (const html of [bluete(), strain()]) {
    const pos = ["data-name", "data-bild", "data-community", "data-geschmack", "data-fuss"].map((m) => html.indexOf(m));
    assert.ok(pos.every((p) => p >= 0), `Teil fehlt: ${pos.join(",")}`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  }
});

test("Karte: Terpen-Chips entfallen, Geschmäcker mit Marker und Screenreader-Text", () => {
  assert.doesNotMatch(karte, /TerpenChips/);
  const html = bluete();
  assert.doesNotMatch(html, /Ocimen|Myrcen/);
  assert.equal((html.match(/✓/g) ?? []).length, 3);
  assert.match(html, /<span class="sr-only">Süß, von der Community bestätigt<\/span>/);
});

test("Strain-Karte: Datenblatt aus terpenGeschmack; ohne Community-Kennwerte alle offen", () => {
  const html = strain();
  assert.equal((html.match(/○/g) ?? []).length, 3);
  assert.match(html, /Holzig, laut Datenblatt, von der Community noch nicht bewertet/);
});

test("Karte: der Link-Überzug liegt weiter über der ganzen Karte", () => {
  const link = bluete().match(/<a [^>]*href="\/blueten\/apples-bananas"[^>]*>/)?.[0] ?? "";
  assert.match(link, /after:absolute after:inset-0/);
});

test("Karte: Community-Zeile schrumpft die Blätter neben der Note, die Stimmen brechen um", () => {
  const html = bluete();
  assert.match(html, /123 Stimmen/);
  assert.match(html, /<div aria-hidden="true" class="min-w-0 flex-1 basis-32">/);
});

test("Karte: Handelsname nie in Handschrift, Wert hat sr-only-Text", () => {
  assert.doesNotMatch(karte, /data-name[^>]*font-hand/);
  assert.match(karte, /sr-only/);
});

test("Blättern: Links funktionieren ohne JS, aktuelle Seite markiert", () => {
  const b = readFileSync("components/katalog/Blaettern.tsx", "utf8");
  assert.match(b, /href=\{hrefFuer\(/);
  assert.match(b, /aria-current="page"/);
  assert.match(b, /preventDefault\(\)/);
});
