import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Dateien mit neuen Seitentexten (Spec 3.2, Akzeptanz 2). */
const ORDNER = [
  "components/story",
  "components/story/bewegung",
  "components/layout",
  "components/marke",
  "components/medien",
  "components/review",
  "components/umfrage",
  "components/ui",
];
const DATEIEN = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/error.tsx",
  "app/reviews/page.tsx",
  "app/umfragen/page.tsx",
  "app/produkte/[slug]/page.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/BestandTabelle.tsx",
  "lib/navigation.ts",
];

/** Geviertstrich überall, Gedankenstrich nur als Trenner zwischen Leerzeichen. */
const TRENNER = /—|\s–\s/;

function dateienIn(ordner: string): string[] {
  const pfad = join(process.cwd(), ordner);
  if (!existsSync(pfad)) return [];
  return readdirSync(pfad)
    .filter((datei) => /\.(ts|tsx)$/.test(datei))
    .map((datei) => `${ordner}/${datei}`);
}

test("neue Texte ohne Geviertstrich und ohne Gedankenstrich als Trenner", () => {
  const treffer: string[] = [];
  for (const datei of [...ORDNER.flatMap(dateienIn), ...DATEIEN]) {
    readFileSync(join(process.cwd(), datei), "utf8")
      .split("\n")
      .forEach((zeile, index) => {
        if (TRENNER.test(zeile)) treffer.push(`${datei}:${index + 1}: ${zeile.trim()}`);
      });
  }
  assert.deepEqual(treffer, []);
});

test("Fehlersätze der Startseite nennen einen Ausweg", () => {
  const ohneAusweg: string[] = [];
  for (const datei of dateienIn("components/story")) {
    readFileSync(join(process.cwd(), datei), "utf8")
      .split("\n")
      .forEach((zeile, index) => {
        if (/lässt sich gerade nicht laden/.test(zeile) && !/Lade die Seite in ein paar Minuten neu/.test(zeile)) {
          ohneAusweg.push(`${datei}:${index + 1}: ${zeile.trim()}`);
        }
      });
  }
  assert.deepEqual(ohneAusweg, []);
});
