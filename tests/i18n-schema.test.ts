import { test } from "node:test";
import assert from "node:assert/strict";

import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { BESCHAFFENHEIT_ACHSEN, BEWERTUNGS_ACHSEN, GESCHMACKS_ACHSEN, INTENSITAETS_STUFEN } from "@/lib/query/bewertung";

// Das Bewertungsschema bleibt in lib/query/bewertung.ts (Admin, Pruefung); das
// Woerterbuch spiegelt seine Texte. Laufen sie auseinander, zeigt Deutsch zweierlei.
test("de.schema spiegelt die Texte des Bewertungsschemas", () => {
  for (const achse of BEWERTUNGS_ACHSEN) {
    assert.equal(de.schema.noten[achse.key].label, achse.label);
    assert.equal(de.schema.noten[achse.key].erlaeuterung, achse.erlaeuterung);
  }
  for (const achse of BESCHAFFENHEIT_ACHSEN) {
    assert.deepEqual(
      { label: achse.label, links: achse.links, rechts: achse.rechts, hinweis: achse.hinweis },
      de.schema.beschaffenheit[achse.key],
    );
  }
  for (const stufe of INTENSITAETS_STUFEN) assert.equal(de.schema.intensitaet[stufe.wert], stufe.label);
  for (const achse of GESCHMACKS_ACHSEN) assert.equal(de.label.geschmack[achse.enumWert], achse.label);
});

test("jede Geschmacksachse hat in beiden Sprachen einen Namen", () => {
  for (const kategorie of GESCHMACKS_KATEGORIEN) {
    assert.ok(de.label.geschmack[kategorie]);
    assert.ok(en.label.geschmack[kategorie]);
  }
});
