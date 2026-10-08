import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { BuchReiter } from "@/components/review/BuchReiter";
import type { EintragDaten } from "@/components/review/eintrag";
import type { KartenTerpen } from "@/lib/aromakarte";
import { musterBildId } from "@/lib/budpics";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

type Ueberschrift = "h2" | "h3";
const props = (teil: Partial<EintragDaten>, ueberschrift: Ueberschrift = "h3") => ({ eintrag: eintrag(teil), ueberschrift, w: de, sprache: "de" as const });

const zeige = (teil: Partial<EintragDaten> = {}, ueberschrift: Ueberschrift = "h3") =>
  // Karte sofort zeichnen: im Server-HTML steht sonst nur ihr Platzhalter (CPU-Limit, Fehler 1102).
  renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, createElement(BuchDoppelseite, props(teil, ueberschrift))));

/** Die zwei Seiten getrennt: alles vor der rechten Seite ist die linke. */
function seiten(html: string) {
  const teil = html.split('data-buchseite="rechts"');
  assert.equal(teil.length, 2, "genau eine rechte Seite");
  assert.equal(teil[0].split('data-buchseite="links"').length, 2, "genau eine linke Seite");
  return { links: teil[0], rechts: teil[1] };
}

const stellen = (html: string, teile: string[]) => teile.map((teil) => html.indexOf(teil));
const aufsteigend = (zahlen: number[]) => zahlen.every((zahl, i) => zahl >= 0 && (i === 0 || zahl > zahlen[i - 1]));

/** Die Props aller BuchReiter im Elementbaum (die Funktion wird direkt aufgerufen, ohne Rendern). */
function reiterProps(teil: Partial<EintragDaten>) {
  const funde: Record<string, unknown>[] = [];
  const suche = (knoten: unknown): void => {
    if (Array.isArray(knoten)) return knoten.forEach(suche);
    if (!knoten || typeof knoten !== "object" || !("props" in knoten)) return;
    const element = knoten as { type: unknown; props: Record<string, unknown> };
    if (element.type === BuchReiter) funde.push(element.props);
    suche(element.props.children);
  };
  suche(BuchDoppelseite(props(teil)));
  return funde;
}

test("Rahmen: eindeutige Id, Überschrift mit Namen, beide Hälften, die Höhe wächst mit dem Inhalt", () => {
  const html = zeige({ id: "r7" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  // title am inneren span: an der Überschrift neben aria-label läse ein Vorleser den Namen doppelt.
  assert.match(html, /<h3 id="eintrag-r7-titel" aria-label="Bewertung von Waldi"[^>]*><span title="Waldi">Waldi<\/span><\/h3>/);
  assert.match(zeige({}, "h2"), /<h2 id="eintrag-r1-titel"/);
  assert.match(html, /<article [^>]*class="[^"]*\blg:min-h-\(--buch-h\)/);
  assert.doesNotMatch(html, /\blg:h-\(--buch-h\)/);
  assert.match(html, /\blg:grid-cols-2\b/);
  // Nichts wird abgeschnitten: weder der Rahmen noch die Hälften verbergen Überlauf.
  assert.doesNotMatch(html, /(<article|data-buchseite="(links|rechts)") [^>]*class="[^"]*overflow-(clip|hidden)/);
  seiten(html);
});

test("Links: Avatar, Name, Marke, Text und Kolophon in dieser Reihenfolge, ohne Noten und Karte", () => {
  const { links } = seiten(zeige());
  assert.ok(
    aufsteigend(stellen(links, ['class="inline-flex shrink-0 select-none', ">Waldi<", ">Betreiber<", "Sehr dichte Blüten.", ">Datum<", ">Charge<", ">Bewertungen insgesamt<"])),
    "Reihenfolge links",
  );
  assert.doesNotMatch(links, /Aussehen|viewBox="0 0 24 24"|data-eintritt="einlage"/);
});

test("Rechts: Blätter, Zahl, fünf Noten und die Einlage mit der Karte in dieser Reihenfolge", () => {
  const { rechts } = seiten(zeige());
  assert.ok(aufsteigend(stellen(rechts, ['viewBox="0 0 24 24"', ">3,5<", ">Aussehen<", ">Konsistenz<", 'data-eintritt="einlage"', "<figure"])), "Reihenfolge rechts");
  assert.doesNotMatch(rechts, /Sehr dichte Blüten\.|>Datum</);
});

test("Die fünf Noten stehen genau einmal im HTML, mobil wie am Rechner", () => {
  const html = zeige();
  assert.equal(html.match(/>Aussehen</g)?.length, 1);
  // Fünf Noten plus Datum, Charge und Zahl im Kolophon.
  assert.equal(html.match(/<dt/g)?.length, 8);
  assert.doesNotMatch(html, /hidden lg:contents|contents lg:hidden/);
});

test("Vermerk von Hand über dem Text: meine notiz beim Betreiber, von euch bei der Community (Nutzer 2026-10-09)", () => {
  const community = seiten(zeige({ istBetreiber: false, autorName: "Mia" })).links;
  assert.match(community, /<p data-eintritt="schreiben" style="--i:1" class="font-hand text-vermerk text-logo[^"]*">von euch<\/p>/);
  assert.match(community, />Community</);
  const betreiber = seiten(zeige()).links;
  assert.match(betreiber, /<p data-eintritt="schreiben" style="--i:1" class="font-hand text-vermerk text-logo[^"]*">meine notiz<\/p>/);
  assert.match(betreiber, />Betreiber</);
  // Der Vermerk steht über dem Text, nach dem Exlibris.
  assert.ok(betreiber.indexOf("meine notiz") > betreiber.indexOf(">Betreiber<"));
});

test("Stimme der Person: kursives Zitat mit grüner Linie, ohne Text kein Vermerk (Nutzer 2026-10-09)", () => {
  const links = seiten(zeige({ notiz: "Zitrus vorne, sauber im Abgang." })).links;
  assert.match(links, /<p [^>]*class="[^"]*\bfont-buch italic\b[^"]*\bborder-l-2 border-accent pl-4\b[^"]*"[^>]*><q>Zitrus vorne, sauber im Abgang\.<\/q><\/p>/);
  const ohne = seiten(zeige({ notiz: null })).links;
  assert.doesNotMatch(ohne, /meine notiz|font-hand/);
});

test("Ohne Autor und ohne Betreiber kein Kreis, sonst ein Avatar mit Ring", () => {
  const anonym = seiten(zeige({ autorName: null, istBetreiber: false })).links;
  assert.match(anonym, />Mitglied</);
  assert.doesNotMatch(anonym, /select-none/);
  const betreiber = seiten(zeige({ autorName: null })).links;
  assert.match(betreiber, />Book of Terpz</);
  // Exlibris (Nutzer 2026-10-09): kleiner Avatar in einer eingefassten Pille, nicht mehr 128 px.
  assert.match(betreiber, /\bsize-10\b/);
  assert.doesNotMatch(betreiber, /\bsize-32\b/);
  assert.match(betreiber, /<header [^>]*class="[^"]*\brounded-full border border-border-strong\b/);
});

test("Exlibris: Name als h3 in text-h3, bricht in der Pille um", () => {
  const html = zeige({ autorName: "A".repeat(50) });
  assert.match(html, /<h3 [^>]*class="[^"]*\btext-h3\b[^"]*\bwrap-break-word\b/);
  assert.doesNotMatch(html, /<h3 [^>]*class="[^"]*\btext-h1\b/);
});

test("Die Zahl der Bewertungen steht nur mit Zahl im Kolophon", () => {
  assert.match(seiten(zeige({ autorBewertungen: 12 })).links, />Bewertungen insgesamt<\/dt><dd[^>]*>12<\/dd>/);
  assert.doesNotMatch(zeige({ autorBewertungen: null }), /Bewertungen insgesamt/);
});

test("Ohne Text steht ruhig ein Hinweis, ohne Knopf", () => {
  const links = seiten(zeige({ notiz: null })).links;
  assert.match(links, /<p class="text-body text-text-muted italic">Kein Text zu dieser Bewertung\.<\/p>/);
  assert.doesNotMatch(links, /Weiterlesen|<button/);
});

test("Langer Text: ab lg begrenzt mit Weiterlesen (nur ab lg), kurzer ohne Knopf", () => {
  const lang = zeige({ notiz: "Sehr dichte Blüten. ".repeat(20) });
  assert.match(lang, /<button [^>]*aria-expanded="false"[^>]*class="[^"]*\bmax-lg:hidden\b[^"]*"[^>]*>Weiterlesen<\/button>/);
  const kurz = zeige();
  assert.match(kurz, /\blg:line-clamp-6\b/);
  assert.doesNotMatch(kurz, /[" ]line-clamp-6/);
  assert.doesNotMatch(kurz, /Weiterlesen/);
});

test("Langer Name klammert ab lg auf zwei Zeilen, bricht um und steht ganz im title", () => {
  const name = "Ein sehr langer Anzeigename eines Mitglieds mit vielen Wörtern darin";
  const html = zeige({ autorName: name });
  assert.match(html, new RegExp(`title="${name}"`));
  // Auch mobil zwei Zeilen: in der runden Pille sprengte ein dreizeiliger Name die Rundung (Review 2026-10-09).
  assert.match(html, /<h3 [^>]*class="[^"]*(?<!lg:)\bline-clamp-2\b/);
  assert.match(html, /<h3 [^>]*class="[^"]*\bwrap-break-word\b/);
});

test("Ohne Gesamtnote (Altbewertung) keine Blätter und keine leere Zahl", () => {
  const html = zeige({ gesamtnote: null });
  assert.doesNotMatch(html, /von 5 Blättern|NaN|data-eintritt="blatt"/);
  assert.equal(html.match(/>Aussehen</g)?.length, 1);
});

test("Kein Kasten im Buch: Terpenbewertung und Beschaffenheit stehen auf dem Papier der Seite", () => {
  // Nutzer 2026-10-06: die dunkle Einlage mit Rand wirkte wie ein Fremdkörper im Buch.
  const { rechts } = seiten(zeige({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] }));
  const einlage = /<div data-eintritt="einlage" style="--i:1" class="([^"]*)"/.exec(rechts);
  assert.ok(einlage, "Einlage fehlt");
  assert.doesNotMatch(einlage[1], /\bbg-|(^| )(border|border-border|lg:border)( |$)|-m[rb]-/);
  assert.match(einlage[1], /\bflex-1\b/);
  // Mobil ohne Reiterleiste trennt eine Haarlinie Urteil und Werte, ab lg die Linie des Registers.
  assert.match(einlage[1], /\bmax-lg:border-t\b/);
  assert.match(rechts, /role="tablist"[^>]*class="[^"]*\bborder-b border-border\b/);
});

test("Beschaffenheit im Buch: die Überschrift steht mobil sichtbar, ab lg nennt sie der Reiter", () => {
  const { rechts } = seiten(zeige({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] }));
  assert.match(rechts, /<h3 class="[^"]*\blg:sr-only\b[^"]*">Beschaffenheit/);
});

test("Reiter: Terpenbewertung zuerst, Beschaffenheit nur mit Werten, Reel erst nach dem Klick", () => {
  assert.doesNotMatch(zeige(), /role="tablist"/);
  assert.match(zeige(), /<p data-register="titel"[^>]*><span[^>]*>Terpenbewertung<\/span><\/p>/);
  const mit = zeige({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] });
  assert.match(mit, /role="tab"[^>]*aria-selected="true"[^>]*>Terpenbewertung</);
  assert.match(mit, /role="tab"[^>]*>Beschaffenheit</);
  const reel = zeige({ instagramReelUrl: "https://www.instagram.com/reel/ABCdef123/" });
  assert.match(reel, /role="tab"[^>]*>Reel</);
  assert.match(reel, /Reel von Instagram laden/);
  assert.doesNotMatch(reel, /<iframe/);
  assert.match(reel, /class="[^"]*\blg:h-full\b[^"]*\blg:w-auto\b/);
  assert.doesNotMatch(zeige({ instagramReelUrl: "https://example.com/reel/x" }), /<iframe|Reel von Instagram laden/);
});

test("Sweet Spot der Terpene kommt nicht zurück, nur die Skala der Karte trägt ihn", () => {
  const html = zeige();
  assert.match(html, /<text[^>]*>Sweet Spot<\/text>/);
  assert.doesNotMatch(html.replace(/<text[^>]*>[^<]*<\/text>/g, ""), /Sweet Spot|Sweet-Spot/i);
});

test("Die Karte im Buch ist dicht und bekommt die Terpenwahl des Bewertenden als Stärken", () => {
  const terpene: KartenTerpen[] = [
    { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.6, rang: 1 },
    { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
  ];
  const reiter = (reiterProps({ terpene, terpenIntensitaet: { Myrcen: 1, Limonen: 0 } })[0].reiter as { inhalt: { props: Record<string, unknown> } }[])[0];
  assert.equal(reiter.inhalt.props.kompakt, true);
  assert.deepEqual(reiter.inhalt.props.staerken, { Myrcen: 1, Limonen: 0 });
  const ohneWahl = (reiterProps({ terpene })[0].reiter as { inhalt: { props: Record<string, unknown> } }[])[0];
  assert.equal(ohneWahl.inhalt.props.staerken, undefined);
});

test("Reiter bekommen nur serialisierbare Props (Server zu Client, sonst Fehlerseite live)", () => {
  const funde = reiterProps({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] });
  assert.equal(funde.length, 1, "genau ein BuchReiter im Baum");
  for (const reiter of funde[0].reiter as { schluessel: string; inhalt: unknown }[]) {
    assert.notEqual(typeof reiter.inhalt, "function", `Reiter ${reiter.schluessel} reicht eine Funktion`);
  }
});

const BILD = (n: number) => ({ id: `${n}f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc`, breite: 800, hoehe: 600, erstelltAm: new Date("2026-10-01T10:00:00Z") });

test("Bildfeld: ein Bild statisch, ohne Diashow-Knöpfe, Beschriftung nur Datum", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1)] }));
  assert.match(links, new RegExp(`src="/api/bild/${BILD(1).id}"`));
  assert.doesNotMatch(links, /Diashow anhalten/);
  assert.match(links, /01\.10\.2026/);
});

test("Bildfeld: drei Bilder als Diashow mit 1 / 3 und eigener Bezeichnung", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1), BILD(2), BILD(3)] }));
  assert.match(links, /1 \/ 3/);
  assert.match(links, /aria-label="Bilder zur Bewertung von Waldi"/);
});

test("Bildfeld: ohne Bild und ohne Herstellerbild das Musterbild, Symbolbild, nur ab lg", () => {
  const { links } = seiten(zeige({ bilder: [], bildPfad: null }));
  assert.match(links, new RegExp(musterBildId("nebelharz-22")));
  assert.match(links, /Symbolbild/);
  assert.match(links, /data-bildfeld="ersatz"[^>]*class="[^"]*\bmax-lg:hidden\b/);
});

test("Bildfeld: ohne Bild mit Herstellerbild dieses, ebenfalls als Symbolbild", () => {
  // Ein Herstellerbild, das nicht zufällig das Musterbild der Sorte ist.
  const hersteller = musterBildId("nebelharz-22") === "bluete-03" ? "bluete-04" : "bluete-03";
  const { links } = seiten(zeige({ bilder: [], bildPfad: hersteller }));
  assert.match(links, new RegExp(`/medien/${hersteller}-`));
  assert.doesNotMatch(links, new RegExp(`/medien/${musterBildId("nebelharz-22")}-`));
  assert.match(links, /Symbolbild/);
});

test("Linke Seite: Kopf, Text, Bildfeld, Kolophon in dieser Reihenfolge", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1)] }));
  assert.ok(aufsteigend(stellen(links, ["<header", "Sehr dichte Blüten.", "data-bildfeld=", "<dl"])));
});

test("Ohne Text: Bildfeld füllt die Seite, der Platzhalter nimmt keinen Raum mehr", () => {
  const { links } = seiten(zeige({ notiz: null, bilder: [BILD(1)] }));
  assert.match(links, /Kein Text zu dieser Bewertung\./);
  assert.doesNotMatch(links, /<p class="[^"]*italic[^"]*lg:flex-1/);
  assert.match(links, /lg:flex-\[1_1_0px\][^"]*"><div class="lg:absolute lg:inset-0"><figure data-bildfeld="bild"/);
});

test("Name verlinkt nur bei öffentlichem Profil", () => {
  const offen = zeige({ istBetreiber: false, autorName: "Mia", autorProfil: "abcd2345" });
  assert.match(offen, /<a [^>]*href="\/profil\/abcd2345"[^>]*>Mia<\/a>/);
  // Der Vorlesename der Überschrift bleibt unverändert.
  assert.match(offen, /aria-label="Bewertung von Mia"/);
  const privat = zeige({ istBetreiber: false, autorName: "Mia", autorProfil: null });
  assert.doesNotMatch(privat, /\/profil\//);
  const ohneAutor = zeige({ istBetreiber: false, autorName: null, autorProfil: "abcd2345" });
  assert.doesNotMatch(ohneAutor, /\/profil\//);
});
