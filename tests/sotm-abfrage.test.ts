import { test } from "node:test";
import assert from "node:assert/strict";
import { sotmAus } from "../lib/query/sotm-ansicht";

const strain = {
  slug: "pedanios-22-8",
  handelsname: "Pedanios 22/8",
  herstellerBildPfad: "/bilder/p.webp",
  aktiv: true,
  kultivar: { name: "Pink Kush" },
};

test("Schnitt auf eine Stelle, Betreiber-Note übernommen", () => {
  const a = sotmAus({
    monat: "2026-11",
    strain,
    mitglieder: { anzahl: 3, schnitt: 4.2666 },
    betreiber: { gesamtnote: 4.5 },
  });
  assert.equal(a.mitglieder.schnitt, 4.3);
  assert.equal(a.mitglieder.anzahl, 3);
  assert.deepEqual(a.betreiber, { gesamtnote: 4.5 });
  assert.equal(a.strain.bluete, "Pink Kush");
  assert.equal(a.strain.bildPfad, "/bilder/p.webp");
  assert.equal(a.monat, "2026-11");
});

test("ohne Community-Reviews schnitt null, ohne Betreiber null", () => {
  const a = sotmAus({ monat: "2026-11", strain, mitglieder: { anzahl: 0, schnitt: null }, betreiber: null });
  assert.equal(a.mitglieder.schnitt, null);
  assert.equal(a.mitglieder.anzahl, 0);
  assert.equal(a.betreiber, null);
});

test("inaktiver Strain, Blüte fällt auf Handelsnamen zurück, kein Bild", () => {
  const a = sotmAus({
    monat: "2026-11",
    strain: { ...strain, aktiv: false, kultivar: null, herstellerBildPfad: null },
    mitglieder: { anzahl: 0, schnitt: null },
    betreiber: null,
  });
  assert.equal(a.strain.aktiv, false);
  assert.equal(a.strain.bluete, "Pedanios 22/8");
  assert.equal(a.strain.bildPfad, null);
});
