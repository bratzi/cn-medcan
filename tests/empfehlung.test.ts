import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import type { GeschmacksKategorie } from "@/db/enums";
import {
  AEHNLICH_SQL,
  bewertungsGewicht,
  empfehlungenBerechnen,
  kosinus,
  sortenVektor,
  type SortenAroma,
} from "@/lib/empfehlung";
import { aromenText, begruendungText } from "@/lib/empfehlung-text";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

const sorte = (strainId: string, terpene: [string, GeschmacksKategorie][]): SortenAroma => ({
  strainId,
  terpene: terpene.map(([name, geschmack], i) => ({ name, geschmack, rang: i + 1 })),
});

const ZITRUS = sorte("zitrus", [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]);
const ZITRUS2 = sorte("zitrus2", [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"], ["Linalool", "BLUMIG"]]);
const ERDE = sorte("erde", [["beta-Caryophyllen", "WUERZIG"], ["Humulen", "HOLZIG"]]);
const ERDE2 = sorte("erde2", [["Humulen", "HOLZIG"], ["beta-Caryophyllen", "WUERZIG"]]);

test("kosinus: gleich 1, orthogonal 0, leer 0", () => {
  assert.equal(kosinus(new Map([["a", 2]]), new Map([["a", 5]])), 1);
  assert.equal(kosinus(new Map([["a", 1]]), new Map([["b", 1]])), 0);
  assert.equal(kosinus(new Map(), new Map([["b", 1]])), 0);
});

test("sortenVektor: Terpene nach Rang gewichtet, dazu ihre Geschmacksachsen", () => {
  const v = sortenVektor(ZITRUS);
  assert.ok((v.get("t:Limonen") ?? 0) > (v.get("t:Myrcen") ?? 0));
  assert.ok((v.get("g:ZITRUS") ?? 0) > 0);
});

test("bewertungsGewicht: ab 3,5 positiv, bis 2 negativ, dazwischen neutral", () => {
  assert.ok(bewertungsGewicht(4.5) > bewertungsGewicht(3.5));
  assert.ok(bewertungsGewicht(3.5) > 0);
  assert.equal(bewertungsGewicht(3), 0);
  assert.equal(bewertungsGewicht(null), 0);
  assert.ok(bewertungsGewicht(2) < 0);
  assert.ok(bewertungsGewicht(0.5) < bewertungsGewicht(2));
});

test("empfehlungen: ähnliches Aroma zuerst, Bewertetes nie, Begründung mit Bezugssorte", () => {
  const liste = empfehlungenBerechnen(
    [{ strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} }],
    [ZITRUS, ZITRUS2, ERDE, ERDE2],
  );
  assert.equal(liste[0].strainId, "zitrus2");
  assert.equal(liste[0].rang, 1);
  assert.equal(liste[0].bezugStrainId, "zitrus");
  assert.ok(liste[0].gemeinsam.includes("t:Limonen"));
  assert.ok(liste[0].gemeinsam.length <= 3);
  assert.ok(!liste.some((e) => e.strainId === "zitrus"));
  // Erdig-würzige Sorten teilen nur wenig und stehen hinten.
  assert.ok(liste.findIndex((e) => e.strainId === "erde") > 0);
});

test("empfehlungen: negative Sorte zieht ähnliche Sorten nach hinten", () => {
  const ohne = empfehlungenBerechnen(
    [{ strainId: "zitrus", gesamtnote: 4, terpene: {}, geschmack: {} }],
    [ZITRUS, ZITRUS2, ERDE, ERDE2, sorte("misch", [["Humulen", "HOLZIG"], ["Limonen", "ZITRUS"]])],
  );
  const mit = empfehlungenBerechnen(
    [
      { strainId: "zitrus", gesamtnote: 4, terpene: {}, geschmack: {} },
      { strainId: "erde", gesamtnote: 1, terpene: {}, geschmack: {} },
    ],
    [ZITRUS, ZITRUS2, ERDE, ERDE2, sorte("misch", [["Humulen", "HOLZIG"], ["Limonen", "ZITRUS"]])],
  );
  const score = (l: typeof ohne, id: string) => l.find((e) => e.strainId === id)?.score ?? 0;
  assert.ok(score(mit, "misch") < score(ohne, "misch"));
  assert.ok(!mit.some((e) => e.strainId === "erde2"));
});

test("empfehlungen: Regler des Nutzers fließen ins Profil", () => {
  const liste = empfehlungenBerechnen(
    [{ strainId: "zitrus", gesamtnote: 4, terpene: { Linalool: 5 }, geschmack: { blumig: 5 } }],
    [ZITRUS, ZITRUS2, sorte("nur-limonen", [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"], ["Humulen", "HOLZIG"]])],
  );
  assert.equal(liste[0].strainId, "zitrus2");
});

test("empfehlungen: ohne positive Bewertung leer, höchstens sechs", () => {
  assert.deepEqual(
    empfehlungenBerechnen([{ strainId: "zitrus", gesamtnote: 3, terpene: {}, geschmack: {} }], [ZITRUS, ZITRUS2]),
    [],
  );
  const viele = Array.from({ length: 20 }, (_, i) => sorte(`s${i}`, [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]));
  assert.equal(
    empfehlungenBerechnen([{ strainId: "s0", gesamtnote: 5, terpene: {}, geschmack: {} }], viele).length,
    6,
  );
});

test("empfehlungen: 700 Sorten deutlich unter dem CPU-Budget", () => {
  const namen: [string, GeschmacksKategorie][] = [
    ["Myrcen", "ERDIG"], ["Limonen", "ZITRUS"], ["beta-Caryophyllen", "WUERZIG"], ["Linalool", "BLUMIG"],
    ["alpha-Pinen", "HOLZIG"], ["Terpinolen", "KRAEUTRIG"], ["Humulen", "HOLZIG"], ["Ocimen", "SUESS"],
  ];
  const sorten = Array.from({ length: 700 }, (_, i) =>
    sorte(`s${i}`, [namen[i % 8], namen[(i * 3 + 1) % 8], namen[(i * 5 + 2) % 8]].filter(
      (n, j, a) => a.findIndex((m) => m[0] === n[0]) === j,
    )),
  );
  const bewertungen = Array.from({ length: 30 }, (_, i) => ({
    strainId: `s${i * 7}`,
    gesamtnote: i % 3 === 0 ? 1.5 : 4.5,
    terpene: { Myrcen: 3 },
    geschmack: { zitrus: 4 },
  }));
  empfehlungenBerechnen(bewertungen, sorten); // Aufwärmen
  let dauer = Infinity;
  let liste = empfehlungenBerechnen(bewertungen, sorten);
  // Bestes von fünf Läufen: misst die Rechnung, nicht die Last des Rechners.
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    liste = empfehlungenBerechnen(bewertungen, sorten);
    dauer = Math.min(dauer, performance.now() - start);
  }
  assert.equal(liste.length, 6);
  assert.ok(dauer < 5, `zu langsam: ${dauer.toFixed(2)} ms`);
});

test("ähnlich im Aroma (SQL): Kosinus über Rang, ohne sich selbst, nur aktive", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE strains (id TEXT PRIMARY KEY, slug TEXT, handelsname TEXT, aktiv INTEGER);
    CREATE TABLE terpene (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE strain_terpene (strain_id TEXT, terpen_id TEXT, rang INTEGER);
    INSERT INTO terpene VALUES ('m','Myrcen'),('l','Limonen'),('c','beta-Caryophyllen'),('h','Humulen');
    INSERT INTO strains VALUES ('a','a','A',1),('b','b','B',1),('c','c','C',1),('d','d','D',0),('e','e','E',1);
    INSERT INTO strain_terpene VALUES
      ('a','l',1),('a','m',2),
      ('b','l',1),('b','m',2),('b','c',3),
      ('c','c',1),('c','h',2),('c','m',3),
      ('d','l',1),('d','m',2),
      ('e','h',1);
  `);
  const zeilen = db.prepare(AEHNLICH_SQL).all("a", "a") as { slug: string; gemeinsam: string }[];
  assert.deepEqual(zeilen.map((z) => z.slug), ["b", "c"]);
  assert.deepEqual(zeilen[0].gemeinsam.split("|").sort(), ["Limonen", "Myrcen"]);
});

test("aromenText: Terpene als Name, Geschmack als Adjektiv, je Sprache", () => {
  assert.equal(aromenText(["t:Myrcen", "t:Limonen", "g:ZITRUS"], de, "de"), "Myrcen, Limonen, zitrisch");
  assert.equal(aromenText(["t:Myrcen", "g:ZITRUS"], en, "en"), "Myrcene, citrusy");
  assert.equal(aromenText(["g:UNBEKANNT", "x"], de, "de"), "");
});

test("begruendungText: nennt Bezugssorte und Aromen, sonst leer", () => {
  assert.equal(
    begruendungText({ bezugHandelsname: "Pink Kush", gemeinsam: ["t:Myrcen", "g:ZITRUS"] }, de, "de"),
    "weil dir Pink Kush gefiel: gemeinsam Myrcen, zitrisch",
  );
  assert.equal(begruendungText({ bezugHandelsname: "Pink Kush", gemeinsam: [] }, de, "de"), "");
});
