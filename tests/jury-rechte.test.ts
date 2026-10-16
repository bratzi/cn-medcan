import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { darfBearbeiten, darfEinreichen, darfVerknuepfen } from "@/lib/jury-rechte";

const autor = { mitgliedId: "a", jury: true, rolle: "MITGLIED" };
test("darfBearbeiten", () => {
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, autor), true);
  assert.equal(darfBearbeiten({ autorId: "a", status: "EINGEREICHT" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, { ...autor, jury: false }), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "ENTWURF" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "VEROEFFENTLICHT" }, { mitgliedId: "x", jury: false, rolle: "ADMIN" }), true);
});
test("darfVerknuepfen: nur eigene, freigegebene Bewertung", () => {
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: true }, "a"), true);
  assert.equal(darfVerknuepfen({ autorId: "b", freigegeben: true }, "a"), false);
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: false }, "a"), false);
  assert.equal(darfVerknuepfen(null, "a"), false);
});

test("Upload lehnt über JURY_BILDER_MAX ab, bevor er schreibt", () => {
  const q = readFileSync("app/[lang]/admin/jury/aktionen.ts", "utf8");
  assert.ok(q.indexOf("bildRecht(b, m, anzahl)") < q.indexOf("juryBild.create"));
  assert.match(q, /export async function juryBildHochladen[\s\S]*?await mitgliedErforderlich\(\)/);
});

test("darfEinreichen: nur aus ENTWURF, auch für Admins", () => {
  const admin = { mitgliedId: "x", jury: false, rolle: "ADMIN" };
  assert.equal(darfEinreichen({ autorId: "a", status: "ENTWURF" }, autor), true);
  assert.equal(darfEinreichen({ autorId: "a", status: "VEROEFFENTLICHT" }, autor), false);
  assert.equal(darfEinreichen({ autorId: "b", status: "VEROEFFENTLICHT" }, admin), false);
  assert.equal(darfEinreichen({ autorId: "b", status: "EINGEREICHT" }, admin), false);
  assert.equal(darfEinreichen({ autorId: "b", status: "ENTWURF" }, autor), false);
});

test("beitragEinreichen prüft über darfEinreichen", () => {
  const q = readFileSync("app/[lang]/jury/aktionen.ts", "utf8");
  assert.match(q, /export async function beitragEinreichen[\s\S]*?darfEinreichen\(b, m\)/);
});

test("Admin-Aktionen revalidieren auch die Folgeseiten des Magazins", () => {
  const q = readFileSync("app/[lang]/admin/jury/aktionen.ts", "utf8");
  assert.equal(q.match(/revalidiereSprachen\("\/jury\/seite\/\[nummer\]", "page"\)/g)?.length, 2);
});

test("ladeJuryTeam sortiert nach Anzeigename", () => {
  const q = readFileSync("lib/query/jury.ts", "utf8");
  assert.match(q, /export async function ladeJuryTeam[\s\S]*?orderBy: \{ anzeigename: "asc" \}/);
});

test("ig-jury: nur Entwurf ohne Graph-Weg, Probe meldet nichts", () => {
  const q = readFileSync("scripts/ig-jury.ts", "utf8");
  assert.doesNotMatch(q, /ig-graph|--planen|--veroeffentlichen/);
  assert.match(q, /igStatus: "ENTWURF"/);
  assert.match(q, /if \(!probe\) \{\s*try \{\s*await meldeStatus\(ursprung, schluessel, \{ slug, igStatus: "FEHLER" \}\)/);
});
