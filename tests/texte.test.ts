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
];
/** app/page.tsx kommt in Task 9 dazu, wenn die alte Startseite ersetzt ist. */
const DATEIEN = ["app/layout.tsx"];

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
