import { test } from "node:test";
import assert from "node:assert/strict";

import {
  abweichungsAnteil,
  achsenImKarte,
  achsenIndex,
  ordneTerpene,
  terpenBoegen,
  balkenLaenge,
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
  // Anteilig nach lib/terpen-aromen.ts: Limonen (Gewicht 3) 75 % Zitrus, 15 % Fruchtig, 10 % Süß;
  // Myrcen (Gewicht 2) 50 % Erdig, 30 % Fruchtig, 20 % Kräutrig. Höchste Achse Zitrus 2,25 = 5.
  assert.equal(profil.zitrus, 5);
  assert.equal(profil.erdig, 2.2);
  assert.equal(profil.fruchtig, 2.3);
  assert.equal(profil.suess, 0.7);
  assert.equal(profil.blumig, 0);
  assert.equal(profil.diesel, 0);
});

test("Terpenbögen: mehrere Noten je Terpen, unbekannte Terpene nur mit Hauptnote, Diesel nie aus Terpenen", () => {
  const myrcen = terpenBoegen({ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: null, rang: 1 });
  assert.equal(myrcen.length, 3);
  assert.equal(Math.round(myrcen.reduce((a, b) => a + b.anteil, 0) * 100), 100);
  assert.deepEqual(terpenBoegen({ name: "Unbekannt", geschmack: "HOLZIG", konzentrationProzent: null, rang: 1 }), [
    { achse: achsenIndex("HOLZIG"), anteil: 1 },
  ]);
  for (const name of ["Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen", "Terpinolen", "Humulen", "Ocimen", "Farnesen", "Nerolidol"]) {
    const boegen = terpenBoegen({ name, geschmack: "ERDIG", konzentrationProzent: null, rang: 1 });
    assert.ok(boegen.every((b) => b.achse !== achsenIndex("DIESEL")), name);
  }
});

test("Ordnung der Terpene folgt dem Mittel ihrer Achsen (wenig Kreuzungen)", () => {
  const t = (name: string) => ({ name, geschmack: "ERDIG" as const, konzentrationProzent: null, rang: 1 });
  const namen = ordneTerpene([t("beta-Caryophyllen"), t("Limonen"), t("alpha-Pinen"), t("Linalool")]).map((x) => x.name);
  assert.deepEqual(namen, ["Limonen", "Linalool", "alpha-Pinen", "beta-Caryophyllen"]);
});

test("Konzentration schlägt Rang", () => {
  const profil = herstellerProfil([
    { name: "A", geschmack: "ZITRUS", konzentrationProzent: 0.2, rang: 1 },
    { name: "B", geschmack: "HOLZIG", konzentrationProzent: 0.8, rang: 2 },
  ]);
  assert.equal(profil?.holzig, 5);
  assert.equal(profil?.zitrus, 1.3);
});

test("Geometrie: zehn Achsen links, Netz beginnt oben, Morph interpoliert", () => {
  assert.equal(achsenImKarte().length, 10);
  assert.deepEqual(netzPunkt(0, 5), { x: MITTE.x, y: MITTE.y - RADIUS });
  assert.deepEqual(netzPunkt(0, 0), MITTE);
  assert.deepEqual(mische({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 10 });
  assert.equal(sanft(0), 0);
  assert.equal(sanft(1), 1);
  assert.match(bogen({ x: 0, y: 0 }, { x: 100, y: 50 }), /^M0,0 C50,0 50,50 100,50$/);
});

test("Geometrie: Achse wandert mit halber Mehrbreite (Skala links, Terpenlinien rechts), Terpene am rechten Rand", () => {
  // Standardaufrufe (ohne breite) bleiben wie vorher: Maßstab bei 640.
  assert.equal(achsenImKarte()[0].x, 260);
  assert.equal(terpeneImKarte(3)[0].x, 490);

  // Balken ab dem linken Rand: bei 640 Achse 260 (Balken 230), bei 1200 bei 260 + 280 = 540 (Balken 510).
  assert.equal(balkenLaenge(), 230);
  assert.equal(balkenLaenge(1200), 510);
  const achsenBreit = achsenImKarte(1200);
  assert.equal(achsenBreit[0].x, 540);
  const terpeneBreit = terpeneImKarte(3, 1200);
  assert.equal(terpeneBreit[0].x, 1050);
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

test("Abweichungsfarbe: lila hoeher wird violetter, Hersteller hoeher gruener, ohne Werte oder gleich null", () => {
  assert.equal(abweichungsAnteil(undefined, 3), null);
  assert.equal(abweichungsAnteil(3, undefined), null);
  assert.equal(abweichungsAnteil(2.5, 2.5), null);
  // Anteil Violett in Prozent, 50 = Mitte; Stärke |Differenz| / 5, um die Hälfte verstärkt, gedeckelt.
  assert.equal(abweichungsAnteil(4, 2), 80);
  assert.equal(abweichungsAnteil(2, 4), 20);
  assert.equal(abweichungsAnteil(5, 0), 100);
  assert.equal(abweichungsAnteil(0, 5), 0);
});
