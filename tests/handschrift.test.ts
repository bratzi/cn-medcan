import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randspalte } from "@/components/story/Randspalte";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { Kandidat, type KandidatProps } from "@/components/umfrage/Kandidat";
import type { Randnotiz } from "@/lib/query/community";
import type { UmfrageOptionAnsicht } from "@/lib/query/umfragen";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

function randspalte(...notizen: Randnotiz[]): string {
  return renderToStaticMarkup(createElement(Randspalte, { notizen, sprache: "de" }));
}

test("Randnotiz mit Zahl: Zahl gedruckt, Wort von Hand, vorgelesen als ein Satz", () => {
  const html = randspalte({ zahl: 1284, wort: "Stimmen" });
  assert.match(html, /<span class="sr-only">1\.284 Stimmen<\/span>/);
  assert.match(
    html,
    /<span aria-hidden="true" data-randzahl="" data-ziel="1284" class="numeric text-display text-text">1\.284<\/span>/,
  );
  assert.match(
    html,
    /<span aria-hidden="true" data-story="randnotiz" class="font-hand text-notiz text-kopierstift">Stimmen<\/span>/,
  );
});

test("Leitsatz: nur Handschrift, ohne Zahl, nichts versteckt", () => {
  const html = randspalte({ zahl: null, wort: "Schlag vor." });
  assert.match(
    html,
    /<span data-story="randnotiz" class="inline-block font-hand text-notiz text-kopierstift">Schlag vor\.<\/span>/,
  );
  assert.doesNotMatch(html, /aria-hidden|data-randzahl|sr-only/);
});

test("Große Zahlen brechen um statt überzulaufen", () => {
  const html = randspalte({ zahl: 1234567, wort: "Stimmen" });
  assert.match(html, /1\.234\.567/);
  assert.match(html, /<li class="flex min-w-0 flex-wrap /);
});

test("Wissen bündeln: Randspalte ab lg, kein Schwenk, keine Wand", () => {
  const quelle = lies("components/story/WissenBuendeln.tsx");
  assert.match(quelle, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)\]/);
  assert.match(quelle, /<Suspense fallback=\{<RandspaltenSkelett ansage=\{w\.start\.skelett\.zahlen\} \/>\}>/);
  assert.doesNotMatch(quelle, /bg-surface-sunken|Textur|wand|font-wand/);
});

test("Schleife: jede Station gedruckt, das Verb als Schlagwort von Hand (Nutzer 2026-09-25)", () => {
  const quelle = lies("components/story/GemeinsamLernen.tsx");
  const stationen = Object.values(de.start.lernen.stationen);
  assert.deepEqual(stationen, ["schlagen vor.", "stimmen ab.", "testen.", "bewerten."]);
  assert.match(quelle, /\{texte\.stationen\[station\]\}/);
  assert.match(quelle, /className="font-buch text-erzaehlung/);
  assert.match(quelle, /className="farbverlauf font-hand text-erzaehlung/);
  assert.doesNotMatch(quelle, /font-wand|wand:|Sedgwick/);
});

test("Abstimmung: „Wähl mit.“ von Hand, ohne Wasserzeichen und Drip", () => {
  const quelle = lies("components/story/Abstimmung.tsx");
  assert.match(quelle, /<p data-story="waehl-mit" className="farbverlauf font-hand text-notiz">\s*\{texte\.waehlMit\}\s*<\/p>/);
  assert.doesNotMatch(quelle, /wasserzeichen|Textur|font-wand|rotate/);
  assert.match(lies("components/story/bewegung/abstimmung.ts"), /SCHREIBEN_AB/);
});

test("Skelett des Stimmzettels hat die Form des Stimmzettels", () => {
  const html = renderToStaticMarkup(createElement(StimmzettelSkelett, { ansage: "Abstimmung wird geladen" }));
  assert.match(html, /role="status"/);
  assert.match(html, /data-skelett=""/);
  assert.match(html, /border border-border-strong bg-surface-raised shadow-md/);
  assert.ok((html.match(/bg-surface-sunken/g)?.length ?? 0) >= 4);
});

function option(teil: Partial<UmfrageOptionAnsicht> = {}): UmfrageOptionAnsicht {
  return {
    id: "o1",
    strainId: "s1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    reihenfolge: 1,
    herkunft: "COMMUNITY",
    istGewinner: false,
    stimmen: 3,
    ergebnisReviewId: null,
    ...teil,
  };
}

function kandidat(teil: Partial<KandidatProps> = {}): string {
  const props: KandidatProps = {
    option: option(),
    gesamt: 5,
    gewaehlt: false,
    zeigeStimmen: true,
    texte: de.umfrage.kandidat,
    sprache: "de",
    ...teil,
  };
  return renderToStaticMarkup(createElement("ul", null, createElement(Kandidat, props)));
}

test("Community-Platz: Vermerk „von euch“ von Hand, der Name gedruckt", () => {
  const html = kandidat();
  assert.match(html, /<span data-story="vermerk" class="font-hand text-vermerk text-kopierstift">von euch<\/span>/);
  assert.doesNotMatch(html, /class="stempel"/);
  const name = /<a [^>]*>Nebelharz 22 \(fiktiv\)<\/a>/.exec(html)?.[0] ?? "";
  assert.match(name, /\bfont-buch\b/);
  assert.doesNotMatch(name, /font-hand/);
});

test("Gesetzter Platz: nicht als gesetzt erkennbar, kein Vermerk, keine Handschrift (Spec Redesign 10)", () => {
  const html = kandidat({ option: option({ herkunft: "GESETZT", stimmen: null }) });
  assert.doesNotMatch(html, /class="stempel"|Gesetzt/);
  assert.doesNotMatch(html, /von euch|font-hand/);
});

test("Eigene Stimme: handgeschriebenes x vor dem Namen, nur als Bild, dazu das Badge", () => {
  const html = kandidat({ gewaehlt: true });
  assert.match(
    html,
    /<span aria-hidden="true" data-story="vermerk" class="font-hand text-vermerk text-kopierstift">x<\/span><a /,
  );
  assert.match(html, /Deine Stimme/);
});

test("Ohne eigene Stimme kein x", () => {
  assert.doesNotMatch(kandidat({ gewaehlt: false }), />x</);
});

test("Das x hängt an derselben Bedingung wie die Zähler: nie in der Vorschlagsphase", () => {
  assert.match(
    lies("components/umfrage/UmfrageKarte.tsx"),
    /const gewaehlteOption = zeigeStimmen && zustand\.art === "ABGESTIMMT" \? zustand\.optionId : null;/,
  );
});

test("/umfragen: Community-Überschriften von Hand, ohne Nebel und ohne Drehung", () => {
  const quelle = lies("app/[lang]/umfragen/page.tsx");
  assert.match(quelle, /const HAND_TITEL = "font-hand text-notiz text-kopierstift";/);
  assert.equal(quelle.match(/className=\{cn\(HAND_TITEL, "self-start max-md:self-center"\)\}/g)?.length, 2);
  assert.doesNotMatch(quelle, /Textur|font-wand|WAND_TITEL|rotate/);
});

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { KarteSofortKontext } from "@/components/review/AromaKarte";

/** Karte sofort zeichnen: im Server-HTML steht sonst nur der Platzhalter (CPU-Limit, Fehler 1102). */
function mitKarte(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, element));
}
import { SortenKopf } from "@/components/review/SortenKopf";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { KatalogSkelett, RandspaltenSkelett } from "@/components/story/Skelette";

test("Sortenkopf: Handelsname in Logoschrift (Nutzerausnahme zu Leitplanke 4), Versalien-Zeilen tracking-wide", () => {
  const html = renderToStaticMarkup(
    createElement(SortenKopf, {
      handelsname: "Nebelharz 22 (fiktiv)",
      bildPfad: null,
      kultivarName: null,
      kultivarTyp: "INDICA",
      genetik: null,
      herstellerName: null,
      thcMin: 20,
      thcMax: 24,
      cbdMin: 0,
      cbdMax: 1,
      terpene: [{ name: "Myrcen", konzentrationProzent: 0.8, rang: 1 }],
      w: de,
      sprache: "de",
    }),
  );
  assert.match(html, /<h3 class="farbverlauf font-hand text-erzaehlung [^"]*"[^>]*>Nebelharz 22 \(fiktiv\)<\/h3>/);
  // Kleine Versalien-Zeilen laufen wie die übrigen der Aroma-Erkundung in tracking-wide.
  assert.equal(html.match(/uppercase tracking-wide/g)?.length, 2);
  assert.doesNotMatch(html, /tracking-gesperrt/);
});

test("Fazit-Zahlen in Handschrift stehen tabellarisch", () => {
  const html = mitKarte(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: [],
      serien: [],
      zeilen: [],
      treue: { wert: 0.8, anzahl: 3 },
      texte: aromaTexte(de, "de"),
    }),
  );
  assert.match(html, /<dd class="relative isolate flex justify-center tabular-nums">/);
  assert.match(html, /fazit-puls farbverlauf font-hand text-umschlag/);
});

test("Skelette haben die Maße der echten Inhalte", () => {
  const katalog = renderToStaticMarkup(createElement(KatalogSkelett, { ansage: "Blüten werden geladen" }));
  // Wie die Karten der Reihe in components/story/Katalog.tsx.
  assert.match(lies("components/story/Katalog.tsx"), /w-72 shrink-0 snap-start sm:w-88/);
  assert.equal(katalog.match(/\bw-72 shrink-0 sm:w-88\b/g)?.length, 3);
  const rand = renderToStaticMarkup(createElement(RandspaltenSkelett, { ansage: "Zahlen werden geladen" }));
  assert.equal(rand.match(/\bh-16 sm:h-20 lg:h-24\b/g)?.length, 3);
  assert.doesNotMatch(rand, /\bh-12\b/);
});

test("Stimmenzahl: Endwert vorgelesen, sichtbare Zahl hochzählbar und aria-hidden", () => {
  const html = kandidat({ option: option({ stimmen: 1284 }) });
  assert.match(html, /<span class="sr-only">1\.284 Stimmen<\/span>/);
  assert.match(html, /<span aria-hidden="true"><span data-stimmzahl="" data-ziel="1284">1\.284<\/span> Stimmen<\/span>/);
  assert.match(html, /<span data-stimmbalken="" class="block h-full origin-left bg-text"/);
});
