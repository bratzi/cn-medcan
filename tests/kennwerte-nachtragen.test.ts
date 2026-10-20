import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

import { sortenKennwerte } from "@/lib/bewertung-v2";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/**
 * Migration 0010 trägt `sorten_kennwerte` für Sorten nach, deren Bewertungen
 * vor T3 gespeichert wurden (Masterplan Bewertung v2, T5): ohne Zeile gäbe es
 * live keinen Community-Median und damit keinen grünen Regler. Geprüft wird
 * gegen die Rechnung, mit der lib/kennwerte.ts beim Speichern fortschreibt.
 */
const SQL = readFileSync(join(process.cwd(), "migrations/0010_kennwerte_nachtragen.sql"), "utf8");

const ACHSEN = { zitrus: 0, fruchtig: 0, suess: 0, blumig: 0, kraeutrig: 0, minzig: 0, holzig: 0, wuerzig: 0, erdig: 0, diesel: 0 };
const matrix = (werte: Partial<typeof ACHSEN>) => JSON.stringify({ ...ACHSEN, ...werte });

type Zeile = {
  strain: string;
  freigegeben: boolean;
  geschmack: string;
  terpene: string | null;
  gesamtnote: number | null;
};

const ZEILEN: Zeile[] = [
  // Sorte A: drei freigegebene, eine kaputte Matrix (zählt als Nullen) und eine kaputte Terpenzeile ({}).
  { strain: "a", freigegeben: true, geschmack: matrix({ zitrus: 4, erdig: 1.5 }), terpene: '{"Myrcen":3,"Limonen":5}', gesamtnote: 4 },
  { strain: "a", freigegeben: true, geschmack: matrix({ zitrus: 2, erdig: 3 }), terpene: '{"Myrcen":1}', gesamtnote: 2.5 },
  { strain: "a", freigegeben: true, geschmack: '{"zitrus":7}', terpene: '{"Myrcen":7}', gesamtnote: null },
  // Eine Achse fehlt (Matrix zählt als Nullen), halbe Terpenstufe (Zeile zählt als leer).
  {
    strain: "a",
    freigegeben: true,
    geschmack: JSON.stringify({ zitrus: 5, fruchtig: 0, suess: 0, blumig: 0, kraeutrig: 0, minzig: 0, holzig: 0, wuerzig: 0, erdig: 5 }),
    terpene: '{"Limonen":2.5}',
    gesamtnote: 1,
  },
  // Nicht freigegeben: zählt nicht.
  { strain: "a", freigegeben: false, geschmack: matrix({ zitrus: 5 }), terpene: '{"Myrcen":5}', gesamtnote: 5 },
  // Sorte B: gerade Anzahl, Median ist das Mittel der beiden mittleren Werte. Die erste Bewertung
  // stammt von vor 2026-09-26: ohne Fruchtig und Minzig, die lesen sich mit 0 (gültig, keine Nullzeile).
  {
    strain: "b",
    freigegeben: true,
    geschmack: '{"diesel":0,"zitrus":2,"erdig":0,"suess":0,"wuerzig":0,"blumig":0,"holzig":1,"kraeutrig":3}',
    terpene: null,
    gesamtnote: 3,
  },
  { strain: "b", freigegeben: true, geschmack: matrix({ holzig: 4 }), terpene: '{"Pinen":2}', gesamtnote: 4.5 },
  // Sorte C: nichts freigegeben, also keine Zeile.
  { strain: "c", freigegeben: false, geschmack: matrix({ diesel: 2 }), terpene: null, gesamtnote: 1 },
  // Sorte D: hat schon Kennwerte aus dem Speichern, die bleiben unberührt.
  { strain: "d", freigegeben: true, geschmack: matrix({ suess: 2 }), terpene: '{"Linalool":4}', gesamtnote: 3.5 },
];

function datenbank() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE "reviews" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "strain_id" TEXT NOT NULL,
      "freigegeben" BOOLEAN NOT NULL DEFAULT false,
      "geschmacks_matrix" TEXT NOT NULL,
      "terpen_intensitaet" TEXT,
      "gesamtnote" REAL
    );
    CREATE TABLE "sorten_kennwerte" (
      "strain_id" TEXT NOT NULL PRIMARY KEY,
      "terpen_median" TEXT NOT NULL,
      "geschmack_median" TEXT NOT NULL,
      "gesamtnote_median" REAL,
      "gesamtnote_mittel" REAL,
      "anzahl" INTEGER NOT NULL,
      "aktualisiert_am" DATETIME NOT NULL
    );
  `);
  const einfuegen = db.prepare(
    `INSERT INTO "reviews" ("id", "strain_id", "freigegeben", "geschmacks_matrix", "terpen_intensitaet", "gesamtnote") VALUES (?, ?, ?, ?, ?, ?)`,
  );
  ZEILEN.forEach((z, i) => einfuegen.run(`r${i}`, z.strain, z.freigegeben ? 1 : 0, z.geschmack, z.terpene, z.gesamtnote));
  db.prepare(
    `INSERT INTO "sorten_kennwerte" VALUES ('d', '{"Linalool":4}', '{}', 3.5, 3.5, 1, '2026-09-29T10:00:00.000Z')`,
  ).run();
  return db;
}

type KennwerteZeile = {
  strain_id: string;
  terpen_median: string;
  geschmack_median: string;
  gesamtnote_median: number | null;
  gesamtnote_mittel: number | null;
  anzahl: number;
  aktualisiert_am: string;
};

/** Was lib/kennwerte.ts beim Speichern für eine Sorte schreiben würde. */
function erwartet(strain: string) {
  return sortenKennwerte(
    ZEILEN.filter((z) => z.strain === strain && z.freigegeben).map((z) => ({
      gesamtnote: z.gesamtnote,
      terpene: parseTerpenIntensitaet(z.terpene),
      geschmack: parseGeschmacksMatrix(z.geschmack),
    })),
  );
}

test("0010: Kennwerte je Sorte wie beim Speichern (Median, kaputte Zeilen, nur freigegebene)", () => {
  const db = datenbank();
  db.exec(SQL);
  const zeilen = db.prepare(`SELECT * FROM "sorten_kennwerte" ORDER BY "strain_id"`).all() as KennwerteZeile[];
  assert.deepEqual(
    zeilen.map((z) => z.strain_id),
    ["a", "b", "d"],
  );
  for (const strain of ["a", "b"]) {
    const zeile = zeilen.find((z) => z.strain_id === strain)!;
    const soll = erwartet(strain);
    assert.deepEqual(JSON.parse(zeile.terpen_median), soll.terpenMedian, strain);
    assert.deepEqual(JSON.parse(zeile.geschmack_median), soll.geschmackMedian, strain);
    assert.equal(zeile.gesamtnote_median, soll.gesamtnoteMedian, strain);
    assert.equal(zeile.gesamtnote_mittel, soll.gesamtnoteMittel, strain);
    assert.equal(zeile.anzahl, soll.anzahl, strain);
    assert.ok(zeile.aktualisiert_am, strain);
  }
  // Bestehende Kennwerte bleiben, wie das Speichern sie geschrieben hat.
  assert.equal(zeilen.find((z) => z.strain_id === "d")?.aktualisiert_am, "2026-09-29T10:00:00.000Z");
});

test("0010: ein zweiter Lauf ändert nichts", () => {
  const db = datenbank();
  db.exec(SQL);
  const vorher = db.prepare(`SELECT * FROM "sorten_kennwerte" ORDER BY "strain_id"`).all();
  db.exec(SQL);
  assert.deepEqual(db.prepare(`SELECT * FROM "sorten_kennwerte" ORDER BY "strain_id"`).all(), vorher);
});
