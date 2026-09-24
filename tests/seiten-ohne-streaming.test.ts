import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Nachschlageseiten laden ihre Daten vor dem Senden (Entscheidung des Nutzers,
 * Welle 1): Eine Suspense-Grenze um den Inhalt schickt ihn in einem
 * versteckten Block hinterher. Dann fehlt er ohne JavaScript (Spec 9.4), der
 * Sprung auf #eintrag-… findet sein Ziel nicht (Spec 13.7), und ein
 * unbekanntes Produkt antwortet mit 200 statt 404 (Spec 9.3).
 */
const SEITEN = ["app/reviews/page.tsx", "app/umfragen/page.tsx", "app/produkte/[slug]/page.tsx"];

test("Unterseiten ohne Suspense-Grenze um den Inhalt", () => {
  const treffer = SEITEN.filter((datei) => /<Suspense\b/.test(readFileSync(join(process.cwd(), datei), "utf8")));
  assert.deepEqual(treffer, []);
});
