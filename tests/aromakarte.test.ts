import { test } from "node:test";
import assert from "node:assert/strict";

import {
  achsenImKarte,
  bogen,
  herstellerProfil,
  mische,
  mitteVon,
  netzPunkt,
  sanft,
  terpeneImKarte,
  MITTE,
  RADIUS,
} from "@/lib/aromakarte";

test("Herstellerprofil: dominantes Terpen setzt seine Achse auf 5, ohne Terpene null", () => {
  assert.equal(herstellerProfil([]), null);
  const profil = herstellerProfil([
    { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: null, rang: 1 },
    { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: null, rang: 2 },
  ]);
  assert.ok(profil);
  assert.equal(profil.zitrus, 5);
  assert.equal(profil.erdig, 3.3);
  assert.equal(profil.suess, 0);
});

test("Konzentration schlägt Rang", () => {
  const profil = herstellerProfil([
    { name: "A", geschmack: "ZITRUS", konzentrationProzent: 0.2, rang: 1 },
    { name: "B", geschmack: "HOLZIG", konzentrationProzent: 0.8, rang: 2 },
  ]);
  assert.equal(profil?.holzig, 5);
  assert.equal(profil?.zitrus, 1.3);
});

test("Geometrie: acht Achsen links, Netz beginnt oben, Morph interpoliert", () => {
  assert.equal(achsenImKarte().length, 8);
  assert.deepEqual(netzPunkt(0, 5), { x: MITTE.x, y: MITTE.y - RADIUS });
  assert.deepEqual(netzPunkt(0, 0), MITTE);
  assert.deepEqual(mische({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 10 });
  assert.equal(sanft(0), 0);
  assert.equal(sanft(1), 1);
  assert.match(bogen({ x: 0, y: 0 }, { x: 100, y: 50 }), /^M0,0 C50,0 50,50 100,50$/);
});

test("Geometrie skaliert mit der Breite (volle Kartenbreite): Achsen und Terpene proportional, Standardaufrufe unveraendert", () => {
  // Standardaufrufe (ohne breite) bleiben wie vorher: Maßstab bei 640.
  assert.equal(achsenImKarte()[0].x, 260);
  assert.equal(terpeneImKarte(3)[0].x, 420);

  // Bei voller Breite (z. B. 1200) skalieren nur die x-Positionen der Spalten mit,
  // proportional zu 260/640 bzw. 420/640.
  const achsenBreit = achsenImKarte(1200);
  assert.equal(achsenBreit[0].x, 487.5);
  const terpeneBreit = terpeneImKarte(3, 1200);
  assert.equal(terpeneBreit[0].x, 787.5);
});

test("Das Netz bleibt bei jeder Breite gleich groß (RADIUS) und zentriert (mitteVon)", () => {
  assert.deepEqual(mitteVon(), MITTE);
  const mitteBreit = mitteVon(1200);
  assert.deepEqual(mitteBreit, { x: 600, y: 240 });
  // Radius bleibt 180, egal wie breit die Karte ist; nur der Mittelpunkt wandert.
  assert.deepEqual(netzPunkt(0, 5, RADIUS, mitteBreit), { x: mitteBreit.x, y: mitteBreit.y - RADIUS });
  assert.deepEqual(netzPunkt(0, 0, RADIUS, mitteBreit), mitteBreit);
  // Ohne mitte-Argument unverändert (Standard bleibt 640).
  assert.deepEqual(netzPunkt(0, 5), { x: MITTE.x, y: MITTE.y - RADIUS });
});

import { mittleTerpenIntensitaet, parseTerpenIntensitaet } from "@/lib/query/bewertung";

test("Terpen-Intensität: kaputt oder leer wird {}, Werte außerhalb 1-5 fallen durch, Mittel je Terpen", () => {
  assert.deepEqual(parseTerpenIntensitaet(null), {});
  assert.deepEqual(parseTerpenIntensitaet("kaputt"), {});
  assert.deepEqual(parseTerpenIntensitaet('{"Myrcen":7}'), {});
  assert.deepEqual(parseTerpenIntensitaet('{"Myrcen":3}'), { Myrcen: 3 });
  assert.deepEqual(mittleTerpenIntensitaet([{ Myrcen: 3 }, { Myrcen: 4, Limonen: 2 }]), {
    Myrcen: { mittel: 3.5, anzahl: 2 },
    Limonen: { mittel: 2, anzahl: 1 },
  });
});
