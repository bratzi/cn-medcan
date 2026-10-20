import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { de } from "@/lib/i18n/de";
import { mehrzahl } from "@/lib/i18n/text";
import type { KatalogDaten } from "@/lib/katalog/typen";
import { verdichte } from "@/lib/katalog/verdichten";

test("Blütenseite: statisch, kein Suspense-key am Filter, kein Router-Aufruf in der Insel", () => {
  const seite = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(seite, /export const dynamic = "force-static"/);
  assert.doesNotMatch(seite, /Suspense[^>]*key=/);
  const insel = readFileSync("components/katalog/KatalogAnsicht.tsx", "utf8");
  assert.doesNotMatch(insel, /router\.(replace|push)/);
  assert.match(insel, /history\.replaceState/);
  assert.match(insel, /history\.pushState/);
  assert.match(insel, /popstate/);
  assert.match(insel, /window\.location\.search/);
  assert.match(insel, /aria-live="polite"/);
});

test("Karte: Screenreader-Note mit Einzahl bei einer Stimme", () => {
  assert.equal(mehrzahl("de", de.katalog.karte.srNote, 1, { note: "4,0" }), "Community-Note 4,0 von 5 aus 1 Stimme");
});

test("Verdichten: Zeitstempel aus D1 (Zahl oder SQL-Text) werden ISO und sortierbar", () => {
  const daten = {
    stand: "", fachkreis: false, vertreiber: [], terpene: [], apotheken: [],
    waren: [{ i: "w1", s: "w1", h: "A", k: "k1", y: "HYBRID", f: "BLUETE", g: null, t0: 1, t1: 2, c0: 0, c1: 0, v: null, b: null, tp: [], st: [], u: 1760000000000 }],
    kultivare: [{ i: "k1", n: "A", s: null, cn: null, ca: 0, en: null, lb: "2026-10-20 12:00:00" }],
  } as unknown as KatalogDaten;
  const v = verdichte(daten);
  assert.equal(v.strains[0]!.u, new Date(1760000000000).toISOString());
  assert.equal(v.blueten[0]!.letzteBewertung, "2026-10-20T12:00:00.000Z");
});
