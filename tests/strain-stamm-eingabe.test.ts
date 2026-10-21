import { test } from "node:test";
import assert from "node:assert/strict";
import { strainStammPruefen, strainSuchtext, terpenAbgleich } from "@/lib/strain-stamm-eingabe";

test("Terpen-Abgleich: bleibende behalten Konzentration (nur Rang), entfernte gelöscht, neue angelegt", () => {
  const r = terpenAbgleich(
    [
      { terpenId: "a", rang: 1 },
      { terpenId: "b", rang: 2 },
      { terpenId: "c", rang: 3 },
    ],
    ["c", "a", "d"],
  );
  assert.deepEqual(r.loeschen, ["b"]);
  assert.deepEqual(r.rangNeu, [
    { terpenId: "c", rang: 1 },
    { terpenId: "a", rang: 2 },
  ]);
  assert.deepEqual(r.anlegen, [{ terpenId: "d", rang: 3 }]);
});

test("Terpen-Abgleich: unveränderte Reihenfolge ändert nichts", () => {
  assert.deepEqual(terpenAbgleich([{ terpenId: "a", rang: 1 }], ["a"]), { loeschen: [], rangNeu: [], anlegen: [] });
});

const basis = {
  strainId: "s1",
  handelsname: "  Pink Kush 22/1 ",
  kultivarId: "k1",
  vertreiberId: "",
  kultivarTyp: "INDICA",
  darreichungsform: "BLUETE",
  thcMin: "20",
  thcMax: "22,5",
  cbdMin: "0",
  cbdMax: "1",
  terpene: ["t1", "t2", ""],
  aktiv: "on",
};

test("gültige Eingabe wird bereinigt", () => {
  const r = strainStammPruefen(basis);
  assert.ok(r.ok);
  assert.equal(r.wert.handelsname, "Pink Kush 22/1");
  assert.equal(r.wert.vertreiberId, null);
  assert.equal(r.wert.thcMaxProzent, 22.5);
  assert.deepEqual(r.wert.terpenIds, ["t1", "t2"]);
  assert.equal(r.wert.aktiv, true);
});

test("fehlendes aktiv heißt inaktiv", () => {
  const r = strainStammPruefen({ ...basis, aktiv: undefined });
  assert.ok(r.ok);
  assert.equal(r.wert.aktiv, false);
});

test("Min über Max wird abgelehnt", () => {
  assert.equal(strainStammPruefen({ ...basis, thcMin: "30" }).ok, false);
});

test("Prozent außerhalb 0–100 und unbekannter Typ werden abgelehnt", () => {
  assert.equal(strainStammPruefen({ ...basis, cbdMax: "101" }).ok, false);
  assert.equal(strainStammPruefen({ ...basis, kultivarTyp: "XYZ" }).ok, false);
  assert.equal(strainStammPruefen({ ...basis, darreichungsform: "PILLE" }).ok, false);
});

test("leerer Handelsname und doppelte Terpene werden abgelehnt", () => {
  assert.equal(strainStammPruefen({ ...basis, handelsname: "  " }).ok, false);
  assert.equal(strainStammPruefen({ ...basis, terpene: ["t1", "t1"] }).ok, false);
});

test("Suchtext klein aus Handelsname und Kultivar", () => {
  assert.equal(strainSuchtext("Pink Kush 22/1", "Pink Kush"), "pink kush 22/1 pink kush");
  assert.equal(strainSuchtext("ABC", null), "abc");
});
