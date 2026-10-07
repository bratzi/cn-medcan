import { test } from "node:test";
import assert from "node:assert/strict";

import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";

/** Eine gespeicherte Bewertung, wie sie aus D1 kommt (JSON-Spalten als Text). */
function gespeichert(ueberschreiben: Partial<Parameters<typeof vorbelegungAus>[0]> = {}): Parameters<typeof vorbelegungAus>[0] {
  return {
    aussehen: 4,
    geruch: 5,
    geschmack: 3,
    wirkung: 2,
    konsistenz: 4,
    gesamtnote: 3.5,
    feuchtigkeitProzent: 11.2,
    geschmacksMatrix: JSON.stringify({ zitrus: 3, fruchtig: 1.5, suess: 0, blumig: 0, kraeutrig: 2, minzig: 0.5, holzig: 0, wuerzig: 1, erdig: 4, diesel: 0 }),
    terpenIntensitaet: JSON.stringify({ Myrcen: 3, Limonen: 4 }),
    beschaffenheit: JSON.stringify({ chlorophyll: 2.5, trichomFarbe: 3 }),
    notiz: "Riecht nach Zitrone.",
    instagramReelUrl: null,
    charge: { chargenNr: "A-17" },
    aktualisiertAm: new Date("2026-09-29T10:00:00.000Z"),
    ...ueberschreiben,
  };
}

test("Vorbelegung: alle gespeicherten Werte kommen als Startwerte der Maske zurück", () => {
  const v = vorbelegungAus(gespeichert());
  assert.equal(v.gesamtnote, 3.5);
  assert.deepEqual(v.noten, { aussehen: 4, geruch: 5, geschmack: 3, wirkung: 2, konsistenz: 4 });
  assert.equal(v.geschmack.erdig, 4);
  assert.equal(v.geschmack.minzig, 0.5);
  assert.deepEqual(v.intensitaet, { Myrcen: 3, Limonen: 4 });
  assert.deepEqual(v.beschaffenheit, { chlorophyll: 2.5, trichomFarbe: 3, feuchte: 11.2 });
  assert.equal(v.chargenNr, "A-17");
  assert.equal(v.notiz, "Riecht nach Zitrone.");
  assert.equal(v.instagramReelUrl, null);
});

test("Vorbelegung: der Stand wechselt mit jedem Speichern", () => {
  assert.equal(vorbelegungAus(gespeichert()).stand, "2026-09-29T10:00:00.000Z");
  assert.notEqual(
    vorbelegungAus(gespeichert({ aktualisiertAm: new Date("2026-09-30T08:00:00.000Z") })).stand,
    vorbelegungAus(gespeichert()).stand,
  );
});

test("Vorbelegung: ohne Restfeuchte, Charge und Gesamtnote bleiben die Felder leer", () => {
  const v = vorbelegungAus(gespeichert({ feuchtigkeitProzent: null, charge: null, gesamtnote: null, notiz: null }));
  assert.equal("feuchte" in v.beschaffenheit, false);
  assert.equal(v.chargenNr, null);
  assert.equal(v.gesamtnote, null);
  assert.equal(v.notiz, null);
});

test("Vorbelegung: eine ungültige Gesamtnote (Altdaten) belegt nichts vor", () => {
  assert.equal(vorbelegungAus(gespeichert({ gesamtnote: 3.3 })).gesamtnote, null);
  assert.equal(vorbelegungAus(gespeichert({ gesamtnote: 7 })).gesamtnote, null);
  assert.equal(vorbelegungAus(gespeichert({ gesamtnote: 0.5 })).gesamtnote, 0.5);
});

test("Vorbelegung: kaputte JSON-Spalten zerstören die Maske nicht", () => {
  const v = vorbelegungAus(gespeichert({ geschmacksMatrix: "{kaputt", terpenIntensitaet: "[1,", beschaffenheit: null }));
  assert.equal(Object.values(v.geschmack).every((wert) => wert === 0), true);
  assert.deepEqual(v.intensitaet, {});
  assert.deepEqual(v.beschaffenheit, { feuchte: 11.2 });
});

test("vorbelegungAus: Bilder der eigenen Bewertung mit Status, ohne Angabe leer", () => {
  assert.deepEqual(vorbelegungAus(gespeichert()).bilder, []);
  const bilder = [
    { id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 800, hoehe: 600, status: "OFFEN" },
    { id: "4f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 600, hoehe: 800, status: "unsinn" },
  ];
  assert.deepEqual(vorbelegungAus(gespeichert({ bilder })).bilder, [
    { id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 800, hoehe: 600, status: "OFFEN" },
    { id: "4f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 600, hoehe: 800, status: "ABGELEHNT" },
  ]);
});
