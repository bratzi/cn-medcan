import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Doppelseite, type DoppelseiteProps } from "@/components/review/Doppelseite";
import { alsEintrag, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

const MATRIX = { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2 };

function eintrag(teil: Partial<EintragDaten> = {}): EintragDaten {
  return {
    id: "r1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    aussehen: 5,
    geruch: 5,
    geschmack: 4,
    wirkung: 5,
    konsistenz: 4,
    geschmacksMatrix: MATRIX,
    feuchtigkeitProzent: 11.2,
    notiz: "Sehr dichte Blüten.",
    instagramReelUrl: null,
    chargenNr: "CH-2401",
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
    ...teil,
  };
}

const zeige = (props: DoppelseiteProps) => renderToStaticMarkup(createElement(Doppelseite, props));

test("Auszug: vier Noten ohne Wirkung, Link springt auf den Eintrag", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 4);
  assert.doesNotMatch(html, /Wirkung/);
  assert.match(html, /href="\/produkte\/nebelharz-22#eintrag-r1"/);
  assert.match(html, /line-clamp-3/);
  assert.match(html, />Nebelharz 22 \(fiktiv\)<\/h3>/);
});

test("Voll: fünf Noten, Überschrift mit Datum, Restfeuchte, kein Link", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 5);
  assert.match(html, /Wirkung/);
  assert.match(html, /Bewertung vom/);
  assert.match(html, /Restfeuchte optimal/);
  assert.doesNotMatch(html, /Ganzen Eintrag lesen/);
  assert.doesNotMatch(html, /line-clamp-3/);
});

test("Voll ohne Charge sagt es ausdrücklich", () => {
  const html = zeige({ eintrag: eintrag({ chargenNr: null }), umfang: "voll", ueberschrift: "h3" });
  assert.match(html, /Charge nicht angegeben/);
});

test("Id und Überschrift eindeutig je Eintrag", () => {
  const html = zeige({ eintrag: eintrag({ id: "r7" }), umfang: "auszug", ueberschrift: "h2" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  assert.match(html, /<h2 id="eintrag-r7-titel"/);
});

test("Story-Ziele nur, wenn die Startseite sie verlangt", () => {
  const ohne = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.doesNotMatch(ohne, /data-story|data-zaehler/);
  const mit = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3", story: true });
  assert.match(mit, /data-story="doppelseite"/);
  assert.equal(mit.match(/data-zaehler=""/g)?.length, 4);
  assert.match(mit, /data-ziel="5"/);
});

test("Reel nur im vollen Eintrag und nur mit gültiger eigener URL", () => {
  const gueltig = "https://www.instagram.com/reel/ABCdef12345/";
  assert.match(zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "voll", ueberschrift: "h3" }), /<iframe/);
  assert.doesNotMatch(zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "auszug", ueberschrift: "h3" }), /<iframe/);
  const fremd = zeige({ eintrag: eintrag({ instagramReelUrl: "https://example.com/reel/x" }), umfang: "voll", ueberschrift: "h3" });
  assert.doesNotMatch(fremd, /<iframe|Kein Video hinterlegt/);
});

test("Lange Handelsnamen brechen um statt überzulaufen", () => {
  const html = zeige({
    eintrag: eintrag({ handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" }),
    umfang: "auszug",
    ueberschrift: "h3",
  });
  assert.match(html, /wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("alsEintrag: Name und Slug vom Produkt, kaputte Matrix wird neutral", () => {
  const e = alsEintrag(
    {
      id: "r1",
      istRedaktionell: true,
      aussehen: 4,
      geruch: 4,
      geschmack: 4,
      wirkung: 4,
      konsistenz: 4,
      feuchtigkeitProzent: null,
      geschmacksMatrix: "kaputt",
      notiz: null,
      instagramReelUrl: null,
      chargenNr: null,
      erstelltAm: new Date("2026-09-12T12:00:00Z"),
    },
    { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22" },
  );
  assert.equal(e.handelsname, "Nebelharz 22 (fiktiv)");
  assert.equal(e.slug, "nebelharz-22");
  assert.deepEqual(e.geschmacksMatrix, leereGeschmacksMatrix());
  assert.equal(eintragHref("nebelharz-22", "r1"), "/produkte/nebelharz-22#eintrag-r1");
});

test("Überschrift: auf Unterseiten kleiner als der Abschnittstitel, auf der Startseite wie bisher", () => {
  const unterseite = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.match(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-h2\b[^"]*"/);
  assert.doesNotMatch(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*text-kapitel/);
  const startseite = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3", story: true });
  assert.match(startseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-kapitel\b/);
});
