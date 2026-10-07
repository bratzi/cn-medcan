import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { Doppelseite, type DoppelseiteProps } from "@/components/review/Doppelseite";
import { alsEintrag, eintragHref } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const zeige = (props: Omit<DoppelseiteProps, "w" | "sprache">) =>
  // Karte sofort zeichnen: im Server-HTML steht sonst nur ihr Platzhalter (CPU-Limit, Fehler 1102).
  renderToStaticMarkup(
    createElement(KarteSofortKontext.Provider, { value: true }, createElement(Doppelseite, { ...props, w: de, sprache: "de" })),
  );

/** Die zwei Seiten einer Doppelseite getrennt: alles vor der rechten Seite ist die linke. */
function seiten(html: string) {
  const teil = html.split('data-buchseite="rechts"');
  assert.equal(teil.length, 2, "genau eine rechte Seite");
  assert.equal(teil[0].split('data-buchseite="links"').length, 2, "genau eine linke Seite");
  return { links: teil[0], rechts: teil[1] };
}

test("Auszug: vier Noten ohne Wirkung, Link springt auf den Eintrag", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 4);
  assert.doesNotMatch(html, /Wirkung/);
  assert.match(html, /href="\/blueten\/nebelharz-22#eintrag-r1"/);
  assert.match(html, />Nebelharz 22 \(fiktiv\)<\/h3>/);
});

test("Auszug: links Kopf, Name, Blätter-Note und darunter der Text; rechts Werte, Karte und Charge", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag(), ueberschrift: "h3" }));
  assert.match(links, /<h3 id="eintrag-r1-titel"/);
  assert.match(links, />Waldi</);
  assert.match(links, /3,5 von 5 Blättern/);
  assert.match(links, /Sehr dichte Blüten\./);
  // Der Text steht unter Name und Note, nicht darüber.
  assert.ok(links.indexOf("3,5 von 5 Blättern") < links.indexOf("Sehr dichte Blüten."));
  assert.doesNotMatch(links, /<dt|<figure|Charge CH-2401/);
  assert.match(rechts, /<dt/);
  assert.match(rechts, /<figure/);
  assert.match(rechts, /Charge CH-2401/);
  assert.doesNotMatch(rechts, /Sehr dichte Blüten\./);
});

test("Ohne Gesamtnote (Altbewertung) keine Blätter und keine leere Zahl", () => {
  const html = zeige({ eintrag: eintrag({ gesamtnote: null }), ueberschrift: "h3" });
  assert.doesNotMatch(html, /von 5 Blättern|NaN/);
});

test("Ohne Autor (Seed, gelöschtes Mitglied) steht ein Ersatzname statt einer Lücke", () => {
  const betreiber = zeige({ eintrag: eintrag({ autorName: null }), ueberschrift: "h3" });
  assert.match(seiten(betreiber).links, />Book of Terpz</);
  const community = zeige({ eintrag: eintrag({ autorName: null, istBetreiber: false }), ueberschrift: "h3" });
  assert.match(seiten(community).links, />Mitglied</);
});

test("Auszug: Datum beim Namen, Charge rechts; der Text links bleibt gekürzt", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag(), ueberschrift: "h3" }));
  assert.match(links, /<time [^>]*>12\.09\.2026<\/time>/);
  assert.match(links, /line-clamp-6/);
  assert.match(rechts, /Charge CH-2401/);
});

test("Id und Überschrift eindeutig je Eintrag", () => {
  const html = zeige({ eintrag: eintrag({ id: "r7" }), ueberschrift: "h2" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  assert.match(html, /<h2 id="eintrag-r7-titel"/);
});

test("Story-Ziele nur, wenn die Startseite sie verlangt", () => {
  const ohne = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.doesNotMatch(ohne, /data-story|data-zaehler/);
  const mit = zeige({ eintrag: eintrag(), ueberschrift: "h3", story: true });
  assert.match(mit, /data-story="doppelseite"/);
  assert.equal(mit.match(/data-zaehler=""/g)?.length, 4);
  assert.match(mit, /data-ziel="5"/);
});

test("Der Auszug zeigt kein Reel, auch mit gültiger Adresse", () => {
  const html = zeige({ eintrag: eintrag({ instagramReelUrl: "https://www.instagram.com/reel/ABCdef12345/" }), ueberschrift: "h3" });
  assert.doesNotMatch(html, /<iframe|Reel von Instagram laden/);
});

test("Lange Handelsnamen brechen um statt überzulaufen", () => {
  const html = zeige({
    eintrag: eintrag({ handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" }),
    ueberschrift: "h3",
  });
  assert.match(html, /wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("alsEintrag: Name und Slug vom Produkt, kaputte Matrix wird neutral, Autor und Gesamtnote durchgereicht", () => {
  const e = alsEintrag(
    {
      id: "r1",
      istRedaktionell: false,
      autorName: "Mia",
      gesamtnote: 4.5,
      aussehen: 4,
      geruch: 4,
      geschmack: 4,
      wirkung: 4,
      konsistenz: 4,
      feuchtigkeitProzent: null,
      geschmacksMatrix: "kaputt",
      terpenIntensitaet: null,
      beschaffenheit: null,
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
  assert.equal(e.istBetreiber, false);
  assert.equal(e.autorName, "Mia");
  assert.equal(e.gesamtnote, 4.5);
  assert.equal(eintragHref("nebelharz-22", "r1"), "/blueten/nebelharz-22#eintrag-r1");
});

test("Überschrift: auf Unterseiten kleiner als der Abschnittstitel, auf der Startseite wie bisher", () => {
  const unterseite = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.match(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-h2\b[^"]*"/);
  assert.doesNotMatch(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*text-kapitel/);
  const startseite = zeige({ eintrag: eintrag(), ueberschrift: "h3", story: true });
  assert.match(startseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-kapitel\b/);
});

test("Buchfalz ab lg: je Seite ein leiser Verlauf von 2rem an der Mitte, die Seiten deckend fürs Umblättern", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.match(html, /<article [^>]*class="[^"]*\blg:grid-cols-2\b/);
  assert.match(
    html,
    /data-buchseite="links" class="[^"]*\bbg-surface-raised\b[^"]*\blg:bg-\[linear-gradient\(to_left,color-mix\(in_oklab,var\(--color-text\)_7%,transparent\),transparent_2rem\)\]/,
  );
  assert.match(
    html,
    /data-buchseite="rechts" class="[^"]*\bbg-surface-raised\b[^"]*\blg:bg-\[linear-gradient\(to_right,color-mix\(in_oklab,var\(--color-text\)_7%,transparent\),transparent_2rem\)\]/,
  );
  // Die Seiten haben ab sm 3rem Innenabstand: der Falz (2rem) reicht nicht unter Bild oder Text.
  assert.equal(html.match(/relative flex min-w-0 flex-col gap-8 bg-surface-raised p-6 sm:p-12/g)?.length, 2);
});

test("Der Auszug kennt weder Reiter noch Kolophon noch feste Höhe noch Einzug", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.doesNotMatch(html, /--buch-h|role="tablist"|lg:grid-cols-5|lg:truncate|lg:contents|data-eintritt/);
});

test("Name verlinkt nur bei öffentlichem Profil", () => {
  const offen = zeige({ eintrag: eintrag({ istBetreiber: false, autorName: "Mia", autorProfil: "abcd2345" }), ueberschrift: "h3" });
  assert.match(offen, /<a [^>]*href="\/profil\/abcd2345"[^>]*>Mia<\/a>/);
  const privat = zeige({ eintrag: eintrag({ istBetreiber: false, autorName: "Mia", autorProfil: null }), ueberschrift: "h3" });
  assert.doesNotMatch(privat, /\/profil\//);
  const ohneAutor = zeige({ eintrag: eintrag({ istBetreiber: false, autorName: null, autorProfil: "abcd2345" }), ueberschrift: "h3" });
  assert.doesNotMatch(ohneAutor, /\/profil\//);
});
