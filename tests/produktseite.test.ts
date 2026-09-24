import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "app/produkte/[slug]/page.tsx"), "utf8");

test("Produktseite: Rückweg als 44-px-Einzellink", () => {
  assert.match(QUELLE, /className=\{einzelLinkKlassen\(\)\}>\s*Alle Produkte/);
});

test("Produktseite: keine Hilfszeile, die auf nicht gezeigte Ränge verweist", () => {
  assert.doesNotMatch(QUELLE, /Rang 1 ist das dominante Terpen/);
});
