import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AUTO_MS,
  ankerSeite,
  autoBlaettern,
  autoZiel,
  blaetterPlan,
  buchReihenfolge,
  drehRichtung,
  klickRichtung,
  nahSeite,
  tastenRichtung,
  wischRichtung,
  zielSeite,
  type AutoLage,
} from "@/lib/buch";

const tag = (t: number) => new Date(Date.UTC(2026, 8, t, 12));

test("Reihenfolge: erst der Betreiber, dann die Community, je neueste zuerst", () => {
  const seiten = buchReihenfolge([
    { id: "c-alt", istRedaktionell: false, erstelltAm: tag(2) },
    { id: "b-alt", istRedaktionell: true, erstelltAm: tag(1) },
    { id: "c-neu", istRedaktionell: false, erstelltAm: tag(9) },
    { id: "b-neu", istRedaktionell: true, erstelltAm: tag(5) },
  ]);
  assert.deepEqual(
    seiten.map((seite) => seite.id),
    ["b-neu", "b-alt", "c-neu", "c-alt"],
  );
});

test("Reihenfolge: ändert die Eingabe nicht und kommt mit leeren Listen aus", () => {
  const eingabe = [
    { id: "c", istRedaktionell: false, erstelltAm: tag(3) },
    { id: "b", istRedaktionell: true, erstelltAm: tag(1) },
  ];
  buchReihenfolge(eingabe);
  assert.deepEqual(eingabe.map((seite) => seite.id), ["c", "b"]);
  assert.deepEqual(buchReihenfolge([]), []);
});

test("Blättern von Hand: an den Rändern bleibt die Seite stehen", () => {
  assert.equal(zielSeite(0, 3, 1), 1);
  assert.equal(zielSeite(1, 3, -1), 0);
  assert.equal(zielSeite(0, 3, -1), null);
  assert.equal(zielSeite(2, 3, 1), null);
});

test("Genau eine Bewertung: es gibt nichts zu blättern", () => {
  assert.equal(zielSeite(0, 1, 1), null);
  assert.equal(zielSeite(0, 1, -1), null);
});

test("Autoplay: nach der letzten Seite wieder die erste, alle 8 Sekunden", () => {
  assert.equal(autoZiel(0, 3), 1);
  assert.equal(autoZiel(2, 3), 0);
  assert.equal(AUTO_MS, 8000);
});

test("Drehrichtung folgt dem Ziel: vorwärts nach hinten, zurück nach vorn (auch beim Sprung auf die erste)", () => {
  assert.equal(drehRichtung(0, 1), 1);
  assert.equal(drehRichtung(3, 1), -1);
  assert.equal(drehRichtung(4, 0), -1);
});

test("Klick links heißt zurück, Klick rechts heißt weiter; die Mitte ist der Falz", () => {
  // Buch von x = 100 bis x = 900, der Falz liegt bei 500.
  assert.equal(klickRichtung(120, 100, 800), -1);
  assert.equal(klickRichtung(499, 100, 800), -1);
  assert.equal(klickRichtung(500, 100, 800), 1);
  assert.equal(klickRichtung(880, 100, 800), 1);
});

test("Wischen: nach links weiter, nach rechts zurück, ab 48 px", () => {
  assert.equal(wischRichtung(-60, 4, 300), 1);
  assert.equal(wischRichtung(60, -4, 300), -1);
  assert.equal(wischRichtung(-40, 0, 400), null);
});

test("Wischen: ein schneller kurzer Wisch zählt, ein Zittern nicht", () => {
  assert.equal(wischRichtung(-30, 2, 60), 1);
  assert.equal(wischRichtung(-12, 0, 20), null);
});

test("Wischen: nur waagerecht; eine schräge oder senkrechte Geste bleibt dem Scrollen", () => {
  assert.equal(wischRichtung(-60, 40, 200), null);
  assert.equal(wischRichtung(10, 200, 200), null);
});

test("Tasten: Pfeil links zurück, Pfeil rechts weiter, sonst nichts", () => {
  assert.equal(tastenRichtung("ArrowLeft"), -1);
  assert.equal(tastenRichtung("ArrowRight"), 1);
  assert.equal(tastenRichtung("ArrowUp"), null);
  assert.equal(tastenRichtung("Enter"), null);
});

const FREI: AutoLage = {
  anzahl: 3,
  laeuft: true,
  ruhe: false,
  zeiger: false,
  fokus: false,
  verborgen: false,
  imBild: true,
};

test("Autoplay läuft nur, wenn nichts dagegen spricht", () => {
  assert.equal(autoBlaettern(FREI), true);
});

test("Autoplay pausiert bei Hover, Fokus, verborgenem Tab, außerhalb des Bildes und auf Wunsch", () => {
  assert.equal(autoBlaettern({ ...FREI, zeiger: true }), false);
  assert.equal(autoBlaettern({ ...FREI, fokus: true }), false);
  assert.equal(autoBlaettern({ ...FREI, verborgen: true }), false);
  assert.equal(autoBlaettern({ ...FREI, imBild: false }), false);
  assert.equal(autoBlaettern({ ...FREI, laeuft: false }), false);
});

test("Autoplay steht bei Sparmodus oder reduzierter Bewegung und bei nur einer Seite", () => {
  assert.equal(autoBlaettern({ ...FREI, ruhe: true }), false);
  assert.equal(autoBlaettern({ ...FREI, anzahl: 1 }), false);
});

test("Blätterplan vorwärts: die rechte Hälfte hebt sich über den Falz, die linke der neuen legt sich", () => {
  assert.deepEqual(blaetterPlan(1), {
    hebt: { haelfte: "rechts", bis: -90, falz: "left" },
    legt: { haelfte: "links", von: 90, falz: "right" },
  });
});

test("Blätterplan zurück: gespiegelt, die linke hebt sich, die rechte der vorigen legt sich", () => {
  assert.deepEqual(blaetterPlan(-1), {
    hebt: { haelfte: "links", bis: 90, falz: "right" },
    legt: { haelfte: "rechts", von: -90, falz: "left" },
  });
});

test("Sprungziel: #eintrag-… schlägt die Seite mit diesem Eintrag auf, sonst bleibt alles", () => {
  const anker = ["eintrag-b", "eintrag-c1", "eintrag-c2"];
  assert.equal(ankerSeite("#eintrag-c1", anker), 1);
  assert.equal(ankerSeite("#eintrag-b", anker), 0);
  assert.equal(ankerSeite("#bewerten", anker), null);
  assert.equal(ankerSeite("", anker), null);
  assert.equal(ankerSeite("#eintrag-c%C3%A4", ["eintrag-cä"]), 0);
});

test("Nahe Seiten: die aufgeschlagene und ihre Nachbarn, über das Ende hinweg (Autoplay springt von der letzten auf die erste)", () => {
  assert.deepEqual([0, 1, 2, 3, 4].filter((seite) => nahSeite(seite, 0, 5)), [0, 1, 4]);
  assert.deepEqual([0, 1, 2, 3, 4].filter((seite) => nahSeite(seite, 2, 5)), [1, 2, 3]);
  assert.deepEqual([0, 1].filter((seite) => nahSeite(seite, 0, 2)), [0, 1]);
  assert.equal(nahSeite(0, 0, 1), true);
});
