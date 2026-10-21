import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { explorerStart, explorerZustand, filtereSorten, differenz } from "@/components/story/explorer-zustand";
import { SortenExplorer } from "@/components/story/SortenExplorer";
import { de } from "@/lib/i18n/de";
import type { ExplorerSorte, ExplorerWare } from "@/lib/query/sorten-explorer";

const ware = (id: string, teil: Partial<ExplorerWare> = {}): ExplorerWare => ({
  vertreiberId: id, vertreiberName: id.toUpperCase(), thc: [20, 24], cbd: [0, 1], staerken: 1, anzahl: 0, note: null, ...teil,
});
const sorten: ExplorerSorte[] = [
  { slug: "gelato", name: "Gelato", typ: "HYBRID", anzahl: 5, waren: [ware("a", { anzahl: 3, note: 4.2, staerken: 2 }), ware("b", { thc: [26, 28] }), ware("c")] },
  { slug: "mac-1", name: "MAC 1", typ: "INDICA", anzahl: 2, waren: [ware("x"), ware("y")] },
];

test("explorerZustand: Start ist die erste Sorte mit ihrer ersten Ware", () => {
  assert.deepEqual(explorerStart(sorten), { sorte: "gelato", ware: "a", vergleich: [], suche: "" });
});

test("explorerZustand: Sortenwechsel setzt Auswahl und Vergleich zurück", () => {
  const z = explorerZustand({ typ: "vergleichen", id: "b" }, explorerStart(sorten));
  const neu = explorerZustand({ typ: "sorte", slug: "mac-1", ersteWare: "x" }, z);
  assert.deepEqual(neu, { sorte: "mac-1", ware: "x", vergleich: [], suche: "" });
});

test("explorerZustand: Vergleichen mit zweiter Ware ergibt [a, b], dritte ersetzt die ältere", () => {
  const zwei = explorerZustand({ typ: "vergleichen", id: "b" }, explorerStart(sorten));
  assert.deepEqual(zwei.vergleich, ["a", "b"]);
  const drei = explorerZustand({ typ: "vergleichen", id: "c" }, zwei);
  assert.deepEqual(drei.vergleich, ["b", "c"]);
  assert.deepEqual(explorerZustand({ typ: "vergleichEnde" }, drei).vergleich, []);
});

test("explorerZustand: Ware wählen ändert nur die Auswahl", () => {
  assert.equal(explorerZustand({ typ: "ware", id: "c" }, explorerStart(sorten)).ware, "c");
});

test("filtereSorten: Suche case-insensitiv, leere Suche zeigt alle", () => {
  assert.deepEqual(filtereSorten(sorten, "mac").map((s) => s.slug), ["mac-1"]);
  assert.deepEqual(filtereSorten(sorten, "  GEL ").map((s) => s.slug), ["gelato"]);
  assert.equal(filtereSorten(sorten, "").length, 2);
  assert.equal(filtereSorten(sorten, "zzz").length, 0);
});

test("differenz: Vorzeichen und Stoff als Text", () => {
  assert.equal(differenz(28, 24, "THC", "de"), "+4 % THC");
  assert.equal(differenz(0.5, 1, "CBD", "de"), "−0,5 % CBD");
  assert.equal(differenz(1, 1, "CBD", "de"), "±0 % CBD");
});

const zeige = () =>
  renderToStaticMarkup(
    createElement(SortenExplorer, { kopf: null, sorten, texte: de.start.vertreiber, typen: de.label.kultivarTyp, sprache: "de" }),
  );

test("SortenExplorer: Sorte mit nur einem Vertreiber hat keinen Vergleich, aber das Bewerten der Variante", () => {
  const html = renderToStaticMarkup(
    createElement(SortenExplorer, {
      kopf: null, sorten: [{ slug: "solo", name: "Solo", typ: "SATIVA", anzahl: 0, waren: [ware("z")] }],
      texte: de.start.vertreiber, typen: de.label.kultivarTyp, sprache: "de",
    }),
  );
  assert.equal((html.match(/class="explorer-karte/g) ?? []).length, 1);
  assert.ok(!html.includes(`${de.start.vertreiber.vergleichen}<`));
  assert.match(html, /href="\/blueten\/solo\?vertreiber=z#bewerten"/);
});

test("SortenExplorer: Server rendert die erste Sorte vollständig", () => {
  const html = zeige();
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /type="search"/);
  assert.match(html, /aria-checked="true"[^>]*>Gelato|Gelato[^<]*<\/button>/);
  assert.equal((html.match(/class="explorer-karte/g) ?? []).length, 3);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(html, /aria-pressed="true"/);
  // „Zum Strain“ steht nur noch am Ende der Bewertung (AromaWechsel), nicht im Explorer.
  assert.doesNotMatch(html, /href="\/blueten\/gelato\?vertreiber=a"/);
  assert.match(html, /href="\/blueten\/gelato\?vertreiber=a#bewerten"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Overall 4,2 von 5/);
  assert.match(html, new RegExp(de.start.vertreiber.hinweis));
});

test("SortenExplorer: Chips mit roving tabindex, nur die aktive ist tabbar", () => {
  const html = zeige();
  assert.equal((html.match(/role="radio"/g) ?? []).length, 2);
  assert.equal((html.match(/role="radio"[^>]*tabindex="0"|tabindex="0"[^>]*role="radio"/g) ?? []).length, 1);
});

test("SortenExplorer: keine Rangfolge nach Note, keine Kaufsprache", () => {
  const html = zeige();
  assert.ok(html.indexOf(">A<") < html.indexOf(">B<"));
  assert.doesNotMatch(html, /apotheke|kaufen|bester|beste /i);
});

test("Explorer-Bewegung: reduzierte Bewegung und Sparmodus schalten sie ab", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.slice(css.indexOf("Sorten-Explorer"));
  assert.match(block, /prefers-reduced-motion: no-preference/);
  assert.match(block, /:root:not\(\[data-sparmodus\]\) \.explorer-/);
});

test("Bewertung und Katalog: lädt den Explorer, alte Beispielkarte ist weg", () => {
  const q = readFileSync("components/story/AromaSektion.tsx", "utf8");
  assert.match(q, /ladeSortenExplorer/);
  assert.match(readFileSync("components/story/AromaWechsel.tsx", "utf8"), /<SortenExplorer/);
  assert.doesNotMatch(q, /VertreiberBeispiel/);
});
