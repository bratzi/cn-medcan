import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { BuchReiter } from "@/components/review/BuchReiter";
import type { EintragDaten } from "@/components/review/eintrag";
import type { KartenTerpen } from "@/lib/aromakarte";
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
  assert.match(html, /<h3 id="eintrag-r7-titel" title="Waldi" aria-label="Bewertung von Waldi"/);
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
  assert.doesNotMatch(links, /Aussehen|<figure|viewBox="0 0 24 24"/);
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

test("Handschrift nur bei Community: von euch am Rand, die Marke bleibt gedruckt", () => {
  const community = seiten(zeige({ istBetreiber: false, autorName: "Mia" })).links;
  assert.match(community, /<p data-eintritt="schreiben" style="--i:1" class="font-hand text-vermerk text-kopierstift[^"]*">von euch<\/p>/);
  assert.match(community, />Community</);
  const betreiber = seiten(zeige()).links;
  assert.doesNotMatch(betreiber, /font-hand|von euch/);
  assert.match(betreiber, />Betreiber</);
});

test("Ohne Autor und ohne Betreiber kein Kreis, sonst ein Avatar mit Ring", () => {
  const anonym = seiten(zeige({ autorName: null, istBetreiber: false })).links;
  assert.match(anonym, />Mitglied</);
  assert.doesNotMatch(anonym, /select-none/);
  const betreiber = seiten(zeige({ autorName: null })).links;
  assert.match(betreiber, />Book of Terpz</);
  assert.match(betreiber, /\bsize-32\b[^"]*\bring-1\b[^"]*\bmax-sm:size-20\b/);
});

test("Die Zahl der Bewertungen steht nur mit Zahl im Kolophon", () => {
  assert.match(seiten(zeige({ autorBewertungen: 12 })).links, />Bewertungen insgesamt<\/dt><dd[^>]*>12<\/dd>/);
  assert.doesNotMatch(zeige({ autorBewertungen: null }), /Bewertungen insgesamt/);
});

test("Ohne Text steht ruhig ein Hinweis, ohne Knopf", () => {
  const links = seiten(zeige({ notiz: null })).links;
  assert.match(links, /<p class="text-body text-text-muted italic lg:flex-1">Kein Text zu dieser Bewertung\.<\/p>/);
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
  assert.match(html, /<h3 [^>]*class="[^"]*\blg:line-clamp-2\b/);
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
