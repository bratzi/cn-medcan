import { test } from "node:test";
import assert from "node:assert/strict";

import { hatTerpenIcon } from "@/components/review/AromaIcon";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { TERPEN_MIT_TABELLE } from "@/lib/terpen-aromen";

// Wächter: Kommt ein Terpen in die Aroma-Tabelle, braucht es in beiden Sprachen
// Satz, Alltagsvergleich und die Register-Tafel (Duft, Vorkommen). Sonst zeigt die
// Startseite eine leere Tafel.
const sprachen = { de, en } as const;

test("jedes Terpen der Aroma-Tabelle hat aroma.satz und aroma.alltag in de und en", () => {
  assert.equal(TERPEN_MIT_TABELLE.length, 24);
  for (const [sprache, w] of Object.entries(sprachen)) {
    const satz = w.aroma.satz as Record<string, string | undefined>;
    const alltag = w.aroma.alltag as Record<string, string | undefined>;
    for (const schluessel of TERPEN_MIT_TABELLE) {
      assert.ok(satz[schluessel]?.trim(), `${sprache}: aroma.satz.${schluessel} fehlt`);
      assert.ok(alltag[schluessel]?.trim(), `${sprache}: aroma.alltag.${schluessel} fehlt`);
    }
  }
});

test("jedes Terpen der Aroma-Tabelle hat start.register.stoffe mit duft und vorkommen in de und en", () => {
  const fehlend: string[] = [];
  for (const [sprache, w] of Object.entries(sprachen)) {
    const stoffe = w.start.register.stoffe as Record<string, { duft?: string; vorkommen?: string } | undefined>;
    for (const schluessel of TERPEN_MIT_TABELLE) {
      if (!stoffe[schluessel]?.duft?.trim()) fehlend.push(`${sprache}: ${schluessel}.duft`);
      if (!stoffe[schluessel]?.vorkommen?.trim()) fehlend.push(`${sprache}: ${schluessel}.vorkommen`);
    }
  }
  assert.deepEqual(fehlend, []);
});

test("jedes Terpen der Aroma-Tabelle hat ein eigenes Icon statt des Sechseckrings", () => {
  const ohne = TERPEN_MIT_TABELLE.filter((schluessel) => !hatTerpenIcon(schluessel));
  assert.deepEqual(ohne, []);
});
