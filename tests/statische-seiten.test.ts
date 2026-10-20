import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { importbaum, ohneKommentare } from "./hilfen/importbaum";

const lies = (datei: string) => readFileSync(datei, "utf8");

/**
 * Spec 2026-10-01 (statische Seiten), 4.3: Jede statische Seite schaltet selbst um
 * (force-static plus revalidate), das Layout hat kein generateStaticParams. Seit 2026-10-20
 * rendert der Build die Seiten ohne Secret mit einem D1-Abzug vor (tests/vorrendern.test.ts);
 * Impressum und Datenschutz entstehen weiter beim ersten Aufruf.
 */
const STATISCH: Record<string, string> = {
  // Täglich, dazu auf Abruf über den D1-Tag-Cache (Session 54).
  "app/[lang]/page.tsx": "86400",
  "app/[lang]/reviews/page.tsx": "86400",
  "app/[lang]/reviews/band/[band]/page.tsx": "86400",
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};

test("Statische Seiten schalten selbst um", () => {
  for (const [datei, revalidate] of Object.entries(STATISCH)) {
    const quelle = lies(datei);
    assert.match(quelle, /export const dynamic = "force-static";/, datei);
    assert.match(quelle, new RegExp(`export const revalidate = ${revalidate};`), datei);
    assert.doesNotMatch(quelle, /force-dynamic/, datei);
  }
});

const VERBOTEN = /lib\/session|aktuellesMitglied|istFachkreis|cookies\(|headers\(/;

test("Statische Seiten lesen keine Sitzung (auch transitiv)", () => {
  const baum = importbaum([...Object.keys(STATISCH), "app/[lang]/layout.tsx"]);
  assert.ok(baum.size > Object.keys(STATISCH).length, "Importbaum wurde nicht aufgelöst");
  for (const [datei, quelle] of baum) {
    assert.doesNotMatch(ohneKommentare(quelle), VERBOTEN, datei);
  }
});
