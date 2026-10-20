import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { IN_ARBEIT, NEUIGKEITEN, type Neuigkeit } from "@/lib/neuigkeiten/eintraege";
import { nachMonat } from "@/lib/neuigkeiten/gruppieren";

const VERBOTEN = /\b(ware|stärke|deploy\w*|commit\w*|migration\w*|cache\w*)\b/i;
const saetze = (text: string) => text.split(/[.!?](\s|$)/).filter((teil) => teil.trim().length > 1).length;

describe("Wächter über die Meldungen", () => {
  const alle = [...NEUIGKEITEN, ...IN_ARBEIT];

  it("hat eindeutige IDs", () => {
    const ids = alle.map((eintrag) => eintrag.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("hat gültige Daten, nicht in der Zukunft", () => {
    const heute = new Date().toISOString().slice(0, 10);
    for (const eintrag of NEUIGKEITEN) {
      assert.match(eintrag.datum, /^\d{4}-\d{2}-\d{2}$/, eintrag.id);
      assert.ok(!Number.isNaN(Date.parse(eintrag.datum)), eintrag.id);
      assert.ok(eintrag.datum <= heute, eintrag.id);
    }
  });

  it("hält Längen ein und füllt beide Sprachen", () => {
    for (const eintrag of alle) {
      for (const sprache of ["de", "en"] as const) {
        assert.notEqual(eintrag.titel[sprache].trim(), "", eintrag.id);
        assert.ok(eintrag.titel[sprache].length <= 80, eintrag.id);
        const anzahl = saetze(eintrag.text[sprache]);
        assert.ok(anzahl > 0 && anzahl <= 3, eintrag.id);
      }
    }
  });

  it("nutzt keine verbotenen Wörter", () => {
    for (const eintrag of alle) {
      const text = `${eintrag.titel.de} ${eintrag.text.de} ${eintrag.titel.en} ${eintrag.text.en}`;
      assert.doesNotMatch(text, VERBOTEN, eintrag.id);
    }
  });

  it("verlinkt nur innerhalb der Seite", () => {
    for (const eintrag of NEUIGKEITEN) if (eintrag.link) assert.match(eintrag.link, /^\//, eintrag.id);
  });
});

describe("nachMonat", () => {
  const meldung = (id: string, datum: string): Neuigkeit => ({
    id,
    datum,
    art: "neu",
    titel: { de: id, en: id },
    text: { de: "x.", en: "x." },
  });

  it("gruppiert neueste zuerst und behält die Reihenfolge am selben Tag", () => {
    const gruppen = nachMonat([meldung("a", "2026-09-03"), meldung("b", "2026-10-01"), meldung("c", "2026-10-01"), meldung("d", "2026-10-15")]);
    assert.deepEqual(gruppen.map((gruppe) => gruppe.monat), ["2026-10", "2026-09"]);
    assert.deepEqual(gruppen[0].eintraege.map((eintrag) => eintrag.id), ["d", "b", "c"]);
  });

  it("liefert für eine leere Liste nichts", () => {
    assert.deepEqual(nachMonat([]), []);
  });
});
