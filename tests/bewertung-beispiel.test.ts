import { test } from "node:test";
import assert from "node:assert/strict";
import { beispielWerte } from "@/lib/bewertung-beispiel";
import type { BandEintrag } from "@/lib/query/buch-band";

function eintrag(teil: { feuchte?: number | null; terpene?: { name: string }[] } = {}): BandEintrag {
  return {
    review: { aussehen: 4, geruch: 5, geschmack: 4, konsistenz: 3, feuchtigkeitProzent: teil.feuchte === undefined ? 11 : teil.feuchte },
    produkt: {
      handelsname: "Remexian 30/1",
      bluete: "Remexian",
      vertreiber: "Purplefarm",
      slug: "remexian",
      bildPfad: null,
      terpene: (teil.terpene ?? [{ name: "Myrcen" }]).map((t, i) => ({ name: t.name, geschmack: "ERDIG", konzentrationProzent: 1, rang: i + 1 })),
    },
  } as unknown as BandEintrag;
}

test("Overall ist der Schnitt der vier Achsen, auf eine Stelle", () => {
  assert.deepEqual(beispielWerte(eintrag()), { bluete: "Remexian", vertreiber: "Purplefarm", slug: "remexian", overall: 4, terpen: "Myrcen", feuchte: 11 });
});

test("ohne Eintrag kein Beispiel", () => {
  assert.equal(beispielWerte(null), null);
});

test("fehlende Feuchte und Terpene bleiben null", () => {
  const w = beispielWerte(eintrag({ feuchte: null, terpene: [] }));
  assert.equal(w?.feuchte, null);
  assert.equal(w?.terpen, null);
});
