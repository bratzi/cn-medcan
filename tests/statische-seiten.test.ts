import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

/**
 * Spec 2026-10-01 (statische Seiten), 4.3: Jede statische Seite schaltet selbst um
 * (force-static plus revalidate), kein generateStaticParams. Gerendert wird beim ersten
 * Aufruf, nicht im Build: der Build hat weder D1 noch Secrets.
 */
const STATISCH: Record<string, string> = {
  "app/[lang]/page.tsx": "300",
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};

test("Statische Seiten schalten selbst um", () => {
  for (const [datei, revalidate] of Object.entries(STATISCH)) {
    const quelle = lies(datei);
    assert.match(quelle, /export const dynamic = "force-static";/, datei);
    assert.match(quelle, new RegExp(`export const revalidate = ${revalidate};`), datei);
    assert.doesNotMatch(quelle, /generateStaticParams|force-dynamic/, datei);
  }
});

test("Statische Seiten lesen keine Sitzung", () => {
  for (const datei of Object.keys(STATISCH)) {
    assert.doesNotMatch(lies(datei), /lib\/session|aktuellesMitglied|istFachkreis|cookies\(|headers\(/, datei);
  }
});
