import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import type { GeschmacksKategorie } from "@/db/enums";
import {
  AEHNLICH_SQL,
  bewertungsGewicht,
  empfehlungenBerechnen,
  empfehlungenErsetzen,
  istBestaetigt,
  KANDIDATEN_ANZAHL,
  KANDIDATEN_SQL,
  profilTerpene,
  SORTEN_AROMA_SQL,
  sortenAusZeilen,
  aehnlichVeraltet,
  AEHNLICH_GUELTIG_MS,
  type EigeneBewertung,
  type SortenAromaZeile,
  type TerpenZeile,
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
  // Sorten ohne ein gemeinsames, positiv bewertetes Terpen sind keine Kandidaten.
  assert.ok(!liste.some((e) => e.strainId === "erde" || e.strainId === "erde2"));
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

/** 700 synthetische Sorten als rohe Zeilen, wie sie aus D1 kommen (je fünf Terpene, jede dritte mit Median). */
function synthetischeZeilen() {
  const terpene = [
    ["m", "Myrcen", "ERDIG"], ["l", "Limonen", "ZITRUS"], ["c", "beta-Caryophyllen", "WUERZIG"], ["li", "Linalool", "BLUMIG"],
    ["p", "alpha-Pinen", "HOLZIG"], ["te", "Terpinolen", "KRAEUTRIG"], ["h", "Humulen", "HOLZIG"], ["o", "Ocimen", "SUESS"],
    ["f", "Farnesen", "FRUCHTIG"], ["n", "Nerolidol", "HOLZIG"], ["b", "Bisabolol", "BLUMIG"], ["g", "Geraniol", "BLUMIG"],
  ].map(([id, name, geschmack]) => ({ id, name, geschmack }));
  const zeilen: SortenAromaZeile[] = Array.from({ length: 700 }, (_, i) => {
    const ids = [...new Set([0, 1, 2, 3, 4].map((j) => terpene[(i * (j + 3) + j * 5) % terpene.length].id))];
    return {
      sid: `s${i}`,
      tp: ids.map((id, r) => `${id}:${r + 1}`).join(","),
      gm: i % 3 === 0 ? JSON.stringify({ zitrus: 3.5, erdig: 2, suess: 1 }) : null,
    };
  });
  const bewertungen = Array.from({ length: 30 }, (_, i) => ({
    strainId: `s${i * 7}`,
    gesamtnote: i % 3 === 0 ? 1.5 : 4.5,
    terpene: { Myrcen: 3, Limonen: 4 },
    geschmack: { zitrus: 4 },
  }));
  return { terpene, zeilen, bewertungen };
}

/** Die Synthese als D1-Tabellen im Speicher, für die SQL-Vorauswahl. */
function synthetischeDatenbank() {
  const { terpene, zeilen, bewertungen } = synthetischeZeilen();
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE strains (id TEXT PRIMARY KEY, aktiv INTEGER);
    CREATE TABLE terpene (id TEXT PRIMARY KEY, name TEXT, geschmack TEXT);
    CREATE TABLE strain_terpene (strain_id TEXT, terpen_id TEXT, rang INTEGER);
    CREATE TABLE sorten_kennwerte (strain_id TEXT PRIMARY KEY, geschmack_median TEXT, gesamtnote_median REAL, anzahl INTEGER);
  `);
  for (const t of terpene) db.prepare(`INSERT INTO terpene VALUES (?, ?, ?)`).run(t.id, t.name, t.geschmack);
  for (const z of zeilen) {
    db.prepare(`INSERT INTO strains VALUES (?, 1)`).run(z.sid);
    for (const teil of z.tp!.split(",")) {
      const [tid, rang] = teil.split(":");
      db.prepare(`INSERT INTO strain_terpene VALUES (?, ?, ?)`).run(z.sid, tid, Number(rang));
    }
    if (z.gm) db.prepare(`INSERT INTO sorten_kennwerte VALUES (?, ?, NULL, 3)`).run(z.sid, z.gm);
  }
  return { db, terpene, zeilen, bewertungen };
}

/** Der Ablauf von empfehlungenFortschreiben ohne Prisma: Profil, Vorauswahl in SQL, genaue Rechnung. */
function mitVorauswahl(db: Database, terpene: TerpenZeile[], bewertungen: EigeneBewertung[]) {
  const ids = JSON.stringify([...new Set(bewertungen.map((b) => b.strainId))]);
  const bewertete = sortenAusZeilen(terpene, db.prepare(SORTEN_AROMA_SQL).all(ids) as SortenAromaZeile[]);
  const gewichte = profilTerpene(bewertungen, bewertete, terpene);
  const roh = db.prepare(KANDIDATEN_SQL).all(JSON.stringify(gewichte), ids, KANDIDATEN_ANZAHL) as SortenAromaZeile[];
  return { roh, bewertete, gewichte };
}

test("Vorauswahl in D1: höchstens 150 Kandidaten, ohne Bewertete, gleiche Top 6 wie über alle Sorten", () => {
  const { db, terpene, zeilen, bewertungen } = synthetischeDatenbank();
  const { roh, bewertete } = mitVorauswahl(db, terpene, bewertungen);
  assert.ok(roh.length <= KANDIDATEN_ANZAHL && roh.length > 6);
  const bewertet = new Set(bewertungen.map((b) => b.strainId));
  assert.ok(!roh.some((z) => bewertet.has(z.sid)));
  const vorausgewaehlt = empfehlungenBerechnen(bewertungen, [...bewertete, ...sortenAusZeilen(terpene, roh)]);
  const ueberAlle = empfehlungenBerechnen(bewertungen, sortenAusZeilen(terpene, zeilen));
  assert.deepEqual(vorausgewaehlt, ueberAlle);
});

test("Vorauswahl in D1: ohne positive Bewertung keine Terpengewichte", () => {
  const { db, terpene } = synthetischeDatenbank();
  const { gewichte } = mitVorauswahl(db, terpene, [{ strainId: "s1", gesamtnote: 1, terpene: {}, geschmack: {} }]);
  assert.deepEqual(gewichte, {});
});

test("empfehlungen: Rechnung im Worker samt Umwandlung der Zeilen unter dem CPU-Budget", (t) => {
  const { db, terpene, bewertungen } = synthetischeDatenbank();
  const { roh } = mitVorauswahl(db, terpene, bewertungen);
  const ids = JSON.stringify([...new Set(bewertungen.map((b) => b.strainId))]);
  const bewerteteRoh = db.prepare(SORTEN_AROMA_SQL).all(ids) as SortenAromaZeile[];
  // Gemessen wird, was der Worker tut: Zeilen umwandeln, Profil, genaue Rechnung.
  const lauf = () => {
    const bewertete = sortenAusZeilen(terpene, bewerteteRoh);
    profilTerpene(bewertungen, bewertete, terpene);
    return empfehlungenBerechnen(bewertungen, [...bewertete, ...sortenAusZeilen(terpene, roh)]);
  };
  const kaltStart = performance.now();
  let liste = lauf();
  const kalt = performance.now() - kaltStart;
  let warm = Infinity;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    liste = lauf();
    warm = Math.min(warm, performance.now() - start);
  }
  t.diagnostic(`kalt ${kalt.toFixed(2)} ms, warm ${warm.toFixed(2)} ms`);
  assert.equal(liste.length, 6);
  // Großzügige Schranken gegen Flackern; die genaue Messung steht im Report.
  assert.ok(kalt < 100, `kalt zu langsam: ${kalt.toFixed(2)} ms`);
  assert.ok(warm < 10, `warm zu langsam: ${warm.toFixed(2)} ms`);
});

test("sortenAusZeilen: Terpene nach Id und Rang, Median als Zahlen, Unbekanntes entfällt", () => {
  const sorten = sortenAusZeilen(
    [{ id: "m", name: "Myrcen", geschmack: "ERDIG" }, { id: "x", name: "Kaputt", geschmack: "UNBEKANNT" }],
    [
      { sid: "a", tp: "m:1,x:2,fehlt:3", gm: '{"zitrus":3,"erdig":"hoch"}' },
      { sid: "b", tp: "x:1", gm: null },
      { sid: "c", tp: null, gm: "kaputt" },
    ],
  );
  assert.deepEqual(sorten, [
    { strainId: "a", terpene: [{ name: "Myrcen", geschmack: "ERDIG", rang: 1 }], geschmackMedian: { zitrus: 3 } },
  ]);
});

test("empfehlungenErsetzen: zweimal speichern ersetzt die Liste atomar, höchstens sechs Zeilen", () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE nutzer_empfehlungen (mitglied_id TEXT, strain_id TEXT, rang INTEGER, score REAL,
    bezug_strain_id TEXT, gemeinsam TEXT, bestaetigt INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (mitglied_id, strain_id))`);
  // Wie D1-batch: alle Anweisungen in einer Transaktion.
  const batch = db.transaction((anweisungen: ReturnType<typeof empfehlungenErsetzen>) => {
    for (const a of anweisungen) db.prepare(a.sql).run(...a.params);
  });
  const { terpene, zeilen } = synthetischeZeilen();
  const sorten = sortenAusZeilen(terpene, zeilen);
  const erste = empfehlungenBerechnen([{ strainId: "s0", gesamtnote: 5, terpene: {}, geschmack: {} }], sorten);
  batch(empfehlungenErsetzen("m1", erste));
  batch(empfehlungenErsetzen("andere", erste.slice(0, 2)));
  const zweite = empfehlungenBerechnen(
    [
      { strainId: "s0", gesamtnote: 5, terpene: {}, geschmack: {} },
      { strainId: erste[0].strainId, gesamtnote: 4, terpene: {}, geschmack: {} },
    ],
    sorten,
  );
  batch(empfehlungenErsetzen("m1", zweite));
  const gespeichert = db.prepare(`SELECT strain_id AS s FROM nutzer_empfehlungen WHERE mitglied_id = 'm1' ORDER BY rang`).all() as { s: string }[];
  assert.equal(gespeichert.length, 6);
  assert.deepEqual(gespeichert.map((z) => z.s), zweite.map((e) => e.strainId));
  assert.ok(!gespeichert.some((z) => z.s === erste[0].strainId));
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM nutzer_empfehlungen WHERE mitglied_id = 'andere'`).get() as { n: number }).n, 2);
  // Scheitert eine Anweisung, bleibt der alte Stand vollständig.
  const kaputt = [...empfehlungenErsetzen("m1", erste), empfehlungenErsetzen("m1", erste)[1]];
  assert.throws(() => batch(kaputt));
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM nutzer_empfehlungen WHERE mitglied_id = 'm1'`).get() as { n: number }).n, 6);
});

test("ähnlich im Aroma (SQL): Kosinus über Rang, ohne sich selbst, nur aktive, ab Mindestähnlichkeit", () => {
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
  // C teilt nur Myrcen auf hinterem Rang: Kosinus unter der Mindestähnlichkeit.
  assert.deepEqual(zeilen.map((z) => z.slug), ["b"]);
  assert.deepEqual(zeilen[0].gemeinsam.split("|").sort(), ["Limonen", "Myrcen"]);
});

test("aehnlichVeraltet: fehlt oder älter als eine Woche, dann neu rechnen", () => {
  assert.equal(aehnlichVeraltet(null, 1000), true);
  assert.equal(aehnlichVeraltet(1000, 1000 + AEHNLICH_GUELTIG_MS), false);
  assert.equal(aehnlichVeraltet(1000, 1001 + AEHNLICH_GUELTIG_MS), true);
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

const mitCommunity = (s: SortenAroma, median: number | null, anzahl: number): SortenAroma => ({ ...s, community: { median, anzahl } });

test("istBestaetigt: ab 2 Bewertungen und Median ab 3,5", () => {
  assert.equal(istBestaetigt({ median: 3.5, anzahl: 2 }), true);
  assert.equal(istBestaetigt({ median: 3.4, anzahl: 5 }), false);
  assert.equal(istBestaetigt({ median: 5, anzahl: 1 }), false);
  assert.equal(istBestaetigt({ median: null, anzahl: 4 }), false);
  assert.equal(istBestaetigt(undefined), false);
});

test("empfehlungen: ab drei bestätigten nur bestätigte, Rang nach Kosinus mal Median", () => {
  const basis = Array.from({ length: 8 }, (_, i) => sorte(`k${i}`, [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]));
  const sorten = [
    ZITRUS,
    mitCommunity(basis[0], 3.5, 2),
    mitCommunity(basis[1], 5, 3),
    mitCommunity(basis[2], 4, 2),
    mitCommunity(basis[3], 5, 1), // zu wenige Stimmen
    mitCommunity(basis[4], 3, 9), // Median zu niedrig
    basis[5],
  ];
  const liste = empfehlungenBerechnen([{ strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} }], sorten);
  assert.deepEqual(liste.map((e) => e.strainId), ["k1", "k2", "k0"]);
  assert.ok(liste.every((e) => e.bestaetigt));
  assert.deepEqual(liste.map((e) => e.rang), [1, 2, 3]);
});

test("empfehlungen: unter drei bestätigten mit unbestätigten nach Aroma aufgefüllt", () => {
  const basis = Array.from({ length: 8 }, (_, i) => sorte(`k${i}`, [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]));
  const sorten = [ZITRUS, mitCommunity(basis[0], 4, 2), ...basis.slice(1)];
  const liste = empfehlungenBerechnen([{ strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} }], sorten);
  assert.equal(liste.length, 6);
  assert.equal(liste[0].strainId, "k0");
  assert.equal(liste[0].bestaetigt, true);
  assert.ok(liste.slice(1).every((e) => !e.bestaetigt));
});

test("sortenAusZeilen: Community-Median und Anzahl aus gn und an", () => {
  const [s] = sortenAusZeilen([{ id: "m", name: "Myrcen", geschmack: "ERDIG" }], [{ sid: "a", tp: "m:1", gm: null, gn: 4.2, an: 3 }]);
  assert.deepEqual(s.community, { median: 4.2, anzahl: 3 });
  const [ohne] = sortenAusZeilen([{ id: "m", name: "Myrcen", geschmack: "ERDIG" }], [{ sid: "b", tp: "m:1", gm: null }]);
  assert.equal(ohne.community, undefined);
});
