import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";

import {
  FILTER_ATTRIBUT,
  FILTER_SCHLUESSEL,
  FILTER_SKRIPT,
  FILTER_STANDARD_OFFEN_AB,
  alsFilterWahl,
  filterIstOffen,
  gespeicherteFilterWahl,
  setzeFilterWahl,
} from "@/lib/katalog/filterspalte";

/** Kleiner Browser-Ersatz: localStorage (auf Wunsch gesperrt), <html>-Attribute, window-Ereignisse. */
function browser({ gesperrt = false, start = {} as Record<string, string> } = {}) {
  const speicher = new Map(Object.entries(start));
  const attribute = new Map<string, string>();
  const ereignisse: string[] = [];
  const pruefe = () => {
    if (gesperrt) throw new Error("SecurityError: Speicher gesperrt");
  };
  const setze = (name: string, wert: unknown) => Object.defineProperty(globalThis, name, { value: wert, configurable: true, writable: true });
  setze("localStorage", {
    getItem: (k: string) => (pruefe(), speicher.get(k) ?? null),
    setItem: (k: string, v: string) => (pruefe(), void speicher.set(k, v)),
  });
  setze("document", {
    documentElement: {
      getAttribute: (n: string) => attribute.get(n) ?? null,
      setAttribute: (n: string, v: string) => void attribute.set(n, v),
      removeAttribute: (n: string) => void attribute.delete(n),
    },
  });
  setze("window", { dispatchEvent: (e: Event) => (ereignisse.push(e.type), true) });
  return { speicher, attribute, ereignisse };
}

afterEach(() => {
  for (const name of ["localStorage", "document", "window"]) delete (globalThis as Record<string, unknown>)[name];
});

test("Filterspalte: nur „offen“ und „zu“ gelten als Wahl", () => {
  assert.equal(alsFilterWahl("offen"), "offen");
  assert.equal(alsFilterWahl("zu"), "zu");
  for (const roh of [null, undefined, "", "1", "OFFEN", 1]) assert.equal(alsFilterWahl(roh), null);
});

test("Filterspalte: ohne Wahl offen ab 1536 px (2xl), darunter zu; eine Wahl schlägt den Standard", () => {
  assert.equal(FILTER_STANDARD_OFFEN_AB, "(min-width: 96rem)");
  assert.equal(filterIstOffen(null, true), true);
  assert.equal(filterIstOffen(null, false), false);
  assert.equal(filterIstOffen("zu", true), false);
  assert.equal(filterIstOffen("offen", false), true);
});

test("Filterspalte: Skript vor dem ersten Zeichnen setzt die gespeicherte Wahl an <html>", () => {
  assert.equal(FILTER_SCHLUESSEL, "bt-katalog-filter");
  assert.equal(FILTER_ATTRIBUT, "data-katalog-filter");
  assert.match(FILTER_SKRIPT, /^\(function\(\)\{try\{/);
  const { attribute } = browser({ start: { "bt-katalog-filter": "offen" } });
  new Function(FILTER_SKRIPT)();
  assert.equal(attribute.get("data-katalog-filter"), "offen");
});

test("Filterspalte: Skript ignoriert Unbekanntes und übersteht gesperrten Speicher (Standard bleibt)", () => {
  const unsinn = browser({ start: { "bt-katalog-filter": "<img>" } });
  new Function(FILTER_SKRIPT)();
  assert.equal(unsinn.attribute.size, 0);
  const gesperrt = browser({ gesperrt: true });
  assert.doesNotThrow(() => new Function(FILTER_SKRIPT)());
  assert.equal(gesperrt.attribute.size, 0);
});

test("Filterspalte: Umschalten merkt die Wahl, setzt das Attribut und meldet die Änderung", () => {
  const { speicher, attribute, ereignisse } = browser();
  setzeFilterWahl("zu");
  assert.equal(speicher.get("bt-katalog-filter"), "zu");
  assert.equal(attribute.get("data-katalog-filter"), "zu");
  assert.equal(ereignisse.length, 1);
  assert.equal(gespeicherteFilterWahl(), "zu");
});

test("Filterspalte: gesperrter Speicher wirft nie, die Spalte folgt dem Klick trotzdem", () => {
  const { attribute } = browser({ gesperrt: true });
  assert.doesNotThrow(() => setzeFilterWahl("offen"));
  assert.equal(attribute.get("data-katalog-filter"), "offen");
  assert.equal(gespeicherteFilterWahl(), null);
});

test("Filterspalte: das Skript steht im <head> des Root-Layouts, neben Thema und Einstellungen", () => {
  const layout = readFileSync("app/[lang]/layout.tsx", "utf8");
  const kopf = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));
  assert.match(kopf, /<script dangerouslySetInnerHTML=\{\{ __html: FILTER_SKRIPT \}\} \/>/);
  assert.match(layout, /import \{ FILTER_SKRIPT \} from "@\/lib\/katalog\/filterspalte";/);
});

test("Filterspalte: CSS entscheidet vor der Hydration, mit derselben Grenze wie das Skript", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /\.katalog-filterspalte\s*\{\s*display:\s*none;\s*\}/);
  const breite = FILTER_STANDARD_OFFEN_AB.match(/\(min-width: ([\d.]+rem)\)/)![1];
  const standard = new RegExp(`@media \\(width >= ${breite.replace(".", "\\.")}\\)\\s*\\{[^@]*:root:not\\(\\[data-katalog-filter="zu"\\]\\) \\.katalog-filterspalte\\s*\\{\\s*display:\\s*block;`);
  assert.match(css, standard, "Standard offen ab 2xl, außer der Besucher hat zu gewählt");
  assert.match(css, /@media \(width >= 64rem\)\s*\{[^@]*:root\[data-katalog-filter="offen"\] \.katalog-filterspalte\s*\{\s*display:\s*block;/);
});
