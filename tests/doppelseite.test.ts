import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { Doppelseite, type DoppelseiteProps } from "@/components/review/Doppelseite";
import { alsEintrag, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";
import { de } from "@/lib/i18n/de";

const MATRIX = { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2, fruchtig: 0, minzig: 0 };

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
    istBetreiber: true,
    autorName: "Waldi",
    gesamtnote: 3.5,
    terpene: [],
    terpenIntensitaet: { Myrcen: 3, Limonen: 4 },
    beschaffenheit: {},
    ...teil,
  };
}

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
  const html = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 4);
  assert.doesNotMatch(html, /Wirkung/);
  assert.match(html, /href="\/blueten\/nebelharz-22#eintrag-r1"/);
  assert.match(html, />Nebelharz 22 \(fiktiv\)<\/h3>/);
});

test("Voll: fünf Noten, Überschrift mit Datum, Restfeuchte, kein Link", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" });
  // Fünf Noten je Fassung: links ab lg, rechts unter lg (T7b, je eine per display verborgen).
  const { links, rechts } = seiten(html);
  assert.equal(links.match(/<dt/g)?.length, 5);
  assert.equal(rechts.match(/<dt/g)?.length, 5);
  assert.match(html, /Wirkung/);
  assert.match(html, /Bewertung vom/);
  assert.match(html, /Restfeuchte optimal/);
  assert.doesNotMatch(html, /Ganzen Eintrag lesen/);
  // Kurzer Text: ab lg begrenzt, aber ohne Knopf; unter lg ganz.
  assert.match(html, /lg:line-clamp-6/);
  assert.doesNotMatch(html, /[" ]line-clamp-6/);
  assert.doesNotMatch(html, /Weiterlesen/);
});

test("Auszug: links Kopf, Name, Blätter-Note und darunter der Text; rechts Werte, Karte und Charge", () => {
  for (const umfang of ["auszug"] as const) {
    const { links, rechts } = seiten(zeige({ eintrag: eintrag(), umfang, ueberschrift: "h3" }));
    assert.match(links, /<h3 id="eintrag-r1-titel"/, umfang);
    assert.match(links, />Waldi</, umfang);
    assert.match(links, /3,5 von 5 Blättern/, umfang);
    assert.match(links, /Sehr dichte Blüten\./, umfang);
    // Der Text steht unter Name und Note, nicht darüber.
    assert.ok(links.indexOf("3,5 von 5 Blättern") < links.indexOf("Sehr dichte Blüten."), umfang);
    assert.doesNotMatch(links, /<dt|<figure|Charge CH-2401/, umfang);
    assert.match(rechts, /<dt/, umfang);
    assert.match(rechts, /<figure/, umfang);
    assert.match(rechts, /Charge CH-2401/, umfang);
    assert.doesNotMatch(rechts, /Sehr dichte Blüten\./, umfang);
  }
});

test("Die Blätter-Note ist die Anzeige der Blattnote, ohne Eingabe", () => {
  const { links } = seiten(zeige({ eintrag: eintrag({ gesamtnote: 3.5 }), umfang: "voll", ueberschrift: "h3" }));
  assert.doesNotMatch(links, /<input|<fieldset|<button/);
  // Fünf Blätter: drei volle, ein halbes, ein leeres (je zwei Hälften plus Kontur und Stiel).
  assert.equal(links.match(/<svg aria-hidden="true" viewBox="0 0 24 24"/g)?.length, 5);
  assert.equal(links.match(/fill-accent opacity-100/g)?.length, 7);
});

test("Ohne Gesamtnote (Altbewertung) keine Blätter und keine leere Zahl", () => {
  const html = zeige({ eintrag: eintrag({ gesamtnote: null }), umfang: "voll", ueberschrift: "h3" });
  assert.doesNotMatch(html, /von 5 Blättern|NaN/);
});

test("Voll: Betreiber und Community sind an der Marke zu unterscheiden", () => {
  const betreiber = seiten(zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" })).links;
  assert.match(betreiber, />Betreiber</);
  assert.doesNotMatch(betreiber, />Community</);
  const community = seiten(
    zeige({ eintrag: eintrag({ istBetreiber: false, autorName: "Mia" }), umfang: "voll", ueberschrift: "h3" }),
  ).links;
  assert.match(community, />Mia</);
  assert.match(community, />Community</);
  assert.doesNotMatch(community, />Betreiber</);
});

test("Ohne Autor (Seed, gelöschtes Mitglied) steht ein Ersatzname statt einer Lücke", () => {
  const betreiber = zeige({ eintrag: eintrag({ autorName: null }), umfang: "voll", ueberschrift: "h3" });
  assert.match(seiten(betreiber).links, />Book of Terpz</);
  const community = zeige({ eintrag: eintrag({ autorName: null, istBetreiber: false }), umfang: "voll", ueberschrift: "h3" });
  assert.match(seiten(community).links, />Mitglied</);
});

test("Auszug: Datum beim Namen, Charge rechts; der Text links bleibt gekürzt", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" }));
  assert.match(links, /<time [^>]*>12\.09\.2026<\/time>/);
  assert.match(links, /line-clamp-6/);
  assert.match(rechts, /Charge CH-2401/);
});

test("Voll ohne Charge sagt es ausdrücklich, als Fuß der linken Seite", () => {
  const html = zeige({ eintrag: eintrag({ chargenNr: null }), umfang: "voll", ueberschrift: "h3" });
  assert.match(seiten(html).links, /Charge nicht angegeben/);
});

test("Buch (voll, T7b): ab lg links Kopf, Name, Blätter, Noten, Restfeuchte, Text und Charge; rechts die Karte als Reiter", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag({ beschaffenheit: { budDichte: 3 } }), umfang: "voll", ueberschrift: "h3" }));
  for (const teil of [/<h3 id="eintrag-r1-titel"/, />Waldi</, /3,5 von 5 Blättern/, /<dt/, /Restfeuchte optimal/, /Sehr dichte Blüten./, /Charge CH-2401/]) {
    assert.match(links, teil);
  }
  const reihe = ["3,5 von 5 Blättern", "<dt", "Restfeuchte optimal", "Sehr dichte Blüten.", "Charge CH-2401"].map((x) => links.indexOf(x));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe, "Reihenfolge links");
  // Noten, Restfeuchte und Charge links nur ab lg.
  assert.match(links, /<div class="hidden lg:contents"><dl/);
  assert.match(links, /<div class="hidden lg:contents"><div class="mt-auto[^"]*"><p [^>]*>Charge CH-2401/);
  assert.doesNotMatch(links, /<figure/);
  assert.match(rechts, /<figure/);
  assert.match(rechts, /role="tablist"/);
  assert.match(rechts, /role="tab"[^>]*aria-selected="true"[^>]*>Aroma-Karte</);
  assert.doesNotMatch(rechts, /Sehr dichte Blüten./);
});

test("Buch (voll, T7b): Sweet Spot der Terpene entfällt (Nutzer 2026-09-30), nur die Skala der Karte trägt ihn", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" });
  // Seit der Sweet-Spot-Skala der Geschmäcker (Nutzer 2026-09-30) beschriftet die Aroma-Karte ihre
  // Mitte mit „Sweet Spot“, auch im Buch. Ein eigener Reiter oder Kasten für Terpene kommt nicht zurück.
  assert.match(html, /<text[^>]*>Sweet Spot<\/text>/);
  const ohneSkala = html.replace(/<text[^>]*>[^<]*<\/text>/g, "");
  assert.doesNotMatch(ohneSkala, /Sweet Spot|Sweet-Spot/i);
});

test("Buch (voll, T7b): mobil wie vorher, rechts Noten und Restfeuchte über der Karte, Charge darunter", () => {
  const { rechts } = seiten(zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" }));
  assert.match(rechts, /<div class="contents lg:hidden"><dl/);
  const reihe = ["<dl", "Restfeuchte optimal", "<figure", "Charge CH-2401"].map((x) => rechts.indexOf(x));
  assert.ok(reihe.every((i) => i >= 0), "alles da");
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe, "Reihenfolge rechts");
  assert.match(rechts, /<div class="contents lg:hidden"><div class="mt-auto/);
});

test("Buch (voll, T7b): feste Höhe ab lg, nichts abgeschnitten, kein zoom; Auszug unberührt", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" });
  assert.match(html, /<article [^>]*class="[^"]*\blg:h-\(--buch-h\)/);
  assert.match(html, /data-buchseite="links" class="[^"]*\blg:py-4\b/);
  // Die Seiten schneiden nichts ab (T7b Review 1), und die Karte wird nicht per zoom verkleinert.
  assert.doesNotMatch(html, /(<article|data-buchseite="(links|rechts)") [^>]*class="[^"]*overflow-(clip|hidden)/);
  assert.doesNotMatch(html, /buch-karte|zoom/);
  assert.match(html, /\blg:grid-cols-5\b/);
  // Einzeilig gekürzt heißt: ganz im title (und im Text für Vorleser).
  assert.match(html, /title="Waldi" class="[^"]*\blg:truncate\b/);
  assert.match(html, /title="Charge CH-2401" class="[^"]*\blg:truncate\b/);
  const auszug = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.doesNotMatch(auszug, /--buch-h|role="tablist"|lg:grid-cols-5|lg:truncate|lg:contents/);
});

test("Buch (voll, T7b): Reel als Reiter, erst nach Klick geladen, ab lg so hoch wie die Tafel", () => {
  const html = zeige({ eintrag: eintrag({ instagramReelUrl: "https://www.instagram.com/reel/ABCdef123/" }), umfang: "voll", ueberschrift: "h3" });
  assert.match(html, /role="tab"[^>]*>Reel</);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /class="[^"]*\blg:h-full\b[^"]*\blg:w-auto\b/);
});

test("Buch (voll, T7b): langer Text ab lg begrenzt mit Weiterlesen (nur ab lg), kurzer ohne", () => {
  const lang = "Sehr dichte Blüten. ".repeat(20);
  const html = zeige({ eintrag: eintrag({ notiz: lang }), umfang: "voll", ueberschrift: "h3" });
  assert.match(html, /<button [^>]*aria-expanded="false"[^>]*class="[^"]*\bmax-lg:hidden\b[^"]*"[^>]*>Weiterlesen<\/button>/);
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
  // Zwei-Klick-Lösung: im vollen Eintrag erst der Lade-Button, noch kein iframe.
  const voll = zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "voll", ueberschrift: "h3" });
  assert.match(voll, /Reel von Instagram laden/);
  assert.doesNotMatch(voll, /<iframe/);
  assert.doesNotMatch(zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "auszug", ueberschrift: "h3" }), /<iframe|Reel von Instagram laden/);
  const fremd = zeige({ eintrag: eintrag({ instagramReelUrl: "https://example.com/reel/x" }), umfang: "voll", ueberschrift: "h3" });
  assert.doesNotMatch(fremd, /<iframe|Kein Video hinterlegt|Reel von Instagram laden/);
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
  const unterseite = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.match(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-h2\b[^"]*"/);
  assert.doesNotMatch(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*text-kapitel/);
  const startseite = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3", story: true });
  assert.match(startseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-kapitel\b/);
});

test("Buchfalz ab lg: je Seite ein leiser Verlauf von 2rem an der Mitte, die Seiten deckend fürs Umblättern", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
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

test("Buch-Reiter bekommen nur serialisierbare Props (Server→Client, sonst Fehlerseite live)", async () => {
  const { BuchReiter } = await import("@/components/review/BuchReiter");
  const baum = Doppelseite({ eintrag: eintrag({ beschaffenheit: { dichte: 3 } as EintragDaten["beschaffenheit"] }), umfang: "voll", ueberschrift: "h3", w: de, sprache: "de" });
  const funde: unknown[] = [];
  const suche = (knoten: unknown): void => {
    if (Array.isArray(knoten)) return knoten.forEach(suche);
    if (!knoten || typeof knoten !== "object" || !("props" in knoten)) return;
    const el = knoten as { type: unknown; props: Record<string, unknown> };
    if (el.type === BuchReiter) funde.push(el.props);
    suche(el.props.children);
  };
  suche(baum);
  assert.equal(funde.length, 1, "genau ein BuchReiter im Baum");
  const reiter = (funde[0] as { reiter: { schluessel: string; inhalt: unknown }[] }).reiter;
  for (const r of reiter) assert.notEqual(typeof r.inhalt, "function", `Reiter ${r.schluessel} reicht eine Funktion`);
});
