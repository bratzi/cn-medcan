import { test } from "node:test";
import assert from "node:assert/strict";

import { SUCHE_MAX, SUCHE_MIN, normalisiereSuche, suchtextBedingung } from "@/lib/sorten-suche";
import { waehleSuchTreffer, type ExplorerSorte, type ExplorerWare } from "@/lib/query/sorten-explorer";

const ware = (id: string): ExplorerWare => ({
  vertreiberId: id, vertreiberName: id.toUpperCase(), thc: [20, 24], cbd: [0, 1], staerken: 1, anzahl: 0, note: null,
});
const sorte = (teil: Partial<ExplorerSorte> = {}): ExplorerSorte => ({
  slug: "s", name: "S", typ: "HYBRID", anzahl: 0, waren: [ware("a"), ware("b")], ...teil,
});

test("normalisiereSuche: unter zwei Zeichen oder leer ist keine Suche", () => {
  assert.equal(SUCHE_MIN, 2);
  assert.equal(normalisiereSuche(null), null);
  assert.equal(normalisiereSuche(""), null);
  assert.equal(normalisiereSuche("a"), null);
  assert.equal(normalisiereSuche("  a  "), null);
});

test("normalisiereSuche: trimmt, fasst Leerraum zusammen und kappt auf 40 Zeichen", () => {
  assert.equal(normalisiereSuche("  mac   1 "), "mac 1");
  assert.equal(normalisiereSuche("zk"), "zk");
  assert.equal(normalisiereSuche("x".repeat(80))?.length, 40);
});

test("waehleSuchTreffer: höchstens 12, nach Menge dann Name, nie nach Note", () => {
  assert.equal(SUCHE_MAX, 12);
  const viele = Array.from({ length: 15 }, (_, i) => sorte({ slug: `s${i}`, name: `S${String(i).padStart(2, "0")}` }));
  assert.equal(waehleSuchTreffer(viele).length, 12);
  const treffer = waehleSuchTreffer([
    sorte({ slug: "b", name: "Beta", anzahl: 1 }),
    sorte({ slug: "z", name: "Zeta", anzahl: 5, waren: [ware("a"), ware("b")].map((w) => ({ ...w, note: 1 })) }),
    sorte({ slug: "a", name: "Alpha", anzahl: 1 }),
  ]);
  assert.deepEqual(treffer.map((s) => s.slug), ["z", "a", "b"]);
});

test("waehleSuchTreffer: Sorte mit nur einer Ware bleibt, eine ohne Ware fällt raus", () => {
  const treffer = waehleSuchTreffer([sorte({ slug: "eins", waren: [ware("a")] }), sorte({ slug: "null", waren: [] }), sorte({ slug: "zwei" })]);
  assert.deepEqual(treffer.map((s) => s.slug).sort(), ["eins", "zwei"]);
});

test("normalisiereSuche: klein geschrieben als Cache-Schlüssel, Umlaute inklusive", () => {
  assert.equal(normalisiereSuche("  MAC  1 "), "mac 1");
  assert.equal(normalisiereSuche("ÄPFEL"), "äpfel");
});

test("suchtextBedingung: wie die Blütenliste, Spalte suchtext mit kleingeschriebenem Text", () => {
  assert.deepEqual(suchtextBedingung("Zkittlez"), { suchtext: { contains: "zkittlez" } });
});
