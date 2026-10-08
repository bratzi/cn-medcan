import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { registerAnsicht, registerParameter, REGISTER_ANFANG } from "@/lib/bewertungs-register";
import { de } from "@/lib/i18n/de";
import type { RegisterZeile } from "@/lib/profil-typen";

const r = (slug: string, note: number, tag: number, community: RegisterZeile["community"] = null, eigen = false): RegisterZeile => ({
  slug,
  handelsname: slug.toUpperCase(),
  erstelltAm: new Date(Date.UTC(2026, 8, tag)),
  gesamtnote: note,
  aussehen: 3,
  geruch: 3,
  geschmack: 3,
  wirkung: 3,
  konsistenz: 3,
  community,
  strainId: `id-${slug}`,
  hersteller: null,
  bildPfad: null,
  eigenesBild: eigen ? { id: "b1", breite: 800, hoehe: 1000, offen: true } : null,
});

test("registerParameter: gültig, ungültig, Array", () => {
  assert.deepEqual(registerParameter({ sortierung: "note", alle: "1" }), { sortierung: "note", alle: true });
  assert.deepEqual(registerParameter({ sortierung: "xyz", alle: "ja" }), { sortierung: "datum", alle: false });
  assert.deepEqual(registerParameter({ sortierung: ["abstand", "note"] }), { sortierung: "abstand", alle: false });
  assert.deepEqual(registerParameter({}), { sortierung: "datum", alle: false });
});

test("registerAnsicht: Datum neu zuerst, Note hoch zuerst, Abstand größter Betrag zuerst", () => {
  const zeilen = [
    r("a", 4, 1, { mittel: 2, anzahl: 3 }),
    r("b", 5, 3, { mittel: 4.8, anzahl: 2 }),
    r("c", 2, 2, null),
  ];
  assert.deepEqual(registerAnsicht(zeilen, { sortierung: "datum", alle: false }).eintraege.map((e) => e.slug), ["b", "c", "a"]);
  assert.deepEqual(registerAnsicht(zeilen, { sortierung: "note", alle: false }).eintraege.map((e) => e.slug), ["b", "a", "c"]);
  assert.deepEqual(
    registerAnsicht(zeilen, { sortierung: "abstand", alle: false }).eintraege.map((e) => e.slug),
    ["a", "b", "c"],
    "ohne Community-Wert ans Ende",
  );
});

test("registerAnsicht: erst zehn, mit alle alle; Bild eigen oder Ersatz", () => {
  const viele = Array.from({ length: 13 }, (_, i) => r(`s${i}`, 3, i + 1, null, i === 12));
  const kurz = registerAnsicht(viele, { sortierung: "datum", alle: false });
  assert.equal(kurz.eintraege.length, REGISTER_ANFANG);
  assert.equal(kurz.gesamt, 13);
  assert.equal(registerAnsicht(viele, { sortierung: "datum", alle: true }).eintraege.length, 13);
  assert.equal(kurz.eintraege[0].bild.art, "eigen");
  assert.equal(kurz.eintraege[1].bild.art, "medium");
});

test("registerAnsicht: leer", () => {
  assert.deepEqual(registerAnsicht([], { sortierung: "datum", alle: false }), { eintraege: [], gesamt: 0 });
});

const render = (zeilen: RegisterZeile[], alle = false) =>
  renderToStaticMarkup(
    createElement(BewertungsRegister, {
      ansicht: registerAnsicht(zeilen, { sortierung: "datum", alle }),
      sortierung: "datum",
      alle,
      texte: de.profil,
      sprache: "de",
    }),
  );

test("BewertungsRegister: Sortier-Links mit aria-current, Name bricht um, Link auf die Blüte", () => {
  const lang = "X".repeat(60);
  const h = render([r(lang.toLowerCase(), 4, 1, { mittel: 3.2, anzahl: 4 })]);
  assert.match(h, /href="\/profil\?sortierung=note#bewertungen-titel"/);
  assert.match(h, /aria-current="true"[^>]*>Neueste/);
  assert.match(h, /href="\/blueten\/x{60}"/);
  assert.match(h, /wrap-break-word/);
  assert.match(h, /Community 3,2 aus 4/);
});

test("BewertungsRegister: „Alle n zeigen“ nur bei mehr als zehn und nicht bei alle", () => {
  const viele = Array.from({ length: 11 }, (_, i) => r(`s${i}`, 3, i + 1));
  assert.match(render(viele), /Alle 11 zeigen/);
  assert.doesNotMatch(render(viele, true), /Alle 11 zeigen/);
  assert.match(render([]), /Noch keine Bewertung/);
});

test("ladeAuswertungsZeilen: eigenes Bild, Hersteller und Bildpfad in derselben Abfrage, mit take", () => {
  const q = readFileSync("lib/query/profil.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function ladeAuswertungsZeilen"));
  assert.match(teil, /bilder:\s*\{/);
  assert.match(teil, /take:\s*1/);
  assert.match(teil, /herstellerBildPfad:\s*true/);
  assert.match(teil, /hersteller:\s*\{\s*select:\s*\{\s*name:\s*true/);
});

test("BewertungsRegister: Abstand 0,04 wird zu 0,0 ohne Vorzeichen, 0,4 zu +0,4", () => {
  const render = (note: number, mittel: number) =>
    renderToStaticMarkup(
      createElement(BewertungsRegister, {
        ansicht: registerAnsicht([r("a", note, 1, { mittel, anzahl: 3 })], { sortierung: "datum", alle: true }),
        sortierung: "datum",
        alle: true,
        texte: de.profil,
        sprache: "de",
      }),
    );
  assert.doesNotMatch(render(4, 3.96), /[+−]0,0/);
  assert.doesNotMatch(render(4, 4.04), /[+−]0,0/);
  assert.match(render(4, 3.6), /\+0,4/);
  assert.match(render(3.6, 4), /−0,4/);
});
