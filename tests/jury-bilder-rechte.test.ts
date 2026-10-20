import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bildRecht, darfBildSehen } from "@/lib/jury-rechte";
import { favouritenSortenIds, JURY_BILDER_MAX } from "@/lib/jury";

const autor = { mitgliedId: "a", jury: true, rolle: "MITGLIED" };
const admin = { mitgliedId: "x", jury: false, rolle: "ADMIN" };
const entwurf = { autorId: "a", status: "ENTWURF" };

test("bildRecht: Jury-Autor darf eigene Entwurfsbilder hochladen", () => {
  assert.equal(bildRecht(entwurf, autor, 0), "ok");
  assert.equal(bildRecht(entwurf, autor, JURY_BILDER_MAX - 1), "ok");
});

test("bildRecht: fremder Beitrag, kein Jury-Flag, veröffentlicht oder eingereicht wird abgelehnt", () => {
  assert.equal(bildRecht({ autorId: "b", status: "ENTWURF" }, autor, 0), "recht");
  assert.equal(bildRecht(entwurf, { ...autor, jury: false }, 0), "recht");
  assert.equal(bildRecht({ autorId: "a", status: "VEROEFFENTLICHT" }, autor, 0), "recht");
  assert.equal(bildRecht({ autorId: "a", status: "EINGEREICHT" }, autor, 0), "recht");
  assert.equal(bildRecht(null, autor, 0), "recht");
});

test("bildRecht: das sechste Bild wird abgelehnt, auch für Admins", () => {
  assert.equal(bildRecht(entwurf, autor, JURY_BILDER_MAX), "voll");
  assert.equal(bildRecht({ autorId: "b", status: "VEROEFFENTLICHT" }, admin, JURY_BILDER_MAX), "voll");
  assert.equal(bildRecht({ autorId: "b", status: "VEROEFFENTLICHT" }, admin, 2), "ok");
});

test("bildRecht ohne Anzahl (Löschen, Ordnen) prüft nur das Recht", () => {
  assert.equal(bildRecht(entwurf, autor), "ok");
  assert.equal(bildRecht({ autorId: "a", status: "VEROEFFENTLICHT" }, autor), "recht");
});

test("darfBildSehen: Admin und Autor, sonst niemand", () => {
  assert.equal(darfBildSehen({ autorId: "a" }, autor), true);
  assert.equal(darfBildSehen({ autorId: "b" }, autor), false);
  assert.equal(darfBildSehen({ autorId: "b" }, admin), true);
  assert.equal(darfBildSehen(null, admin), false);
});

test("Bild-Aktionen prüfen das Recht aus der Sitzung vor dem Schreiben", () => {
  const q = readFileSync("app/[lang]/admin/jury/aktionen.ts", "utf8");
  assert.match(q, /export async function juryBildHochladen[\s\S]*?await mitgliedErforderlich\(\)[\s\S]*?bildRecht\(/);
  assert.match(q, /async function bildZugriff[\s\S]*?await mitgliedErforderlich\(\)[\s\S]*?bildRecht\(/);
  for (const name of ["juryBildLoeschen", "juryBildVerschieben", "juryBildSymbol"]) {
    assert.match(q, new RegExp(`export async function ${name}[\\s\\S]*?await bildZugriff\\(id\\)`), name);
  }
  assert.ok(q.indexOf('=== "voll"') < q.indexOf("juryBild.create"));
});

test("Vorschau offener Jury-Bilder: Autor über darfBildSehen", () => {
  const q = readFileSync("app/api/bild/offen/[id]/route.ts", "utf8");
  assert.match(q, /darfBildSehen\(/);
  assert.match(q, /no-store/);
});

test("favouritenSortenIds: Beitragssorten und Abstimmungssorten ohne Doppel, höchstens 50", () => {
  assert.deepEqual(favouritenSortenIds(["s1", null, "s2", "s1"], ["s2", "s3"]), ["s1", "s2", "s3"]);
  const viele = Array.from({ length: 80 }, (_, i) => `s${i}`);
  assert.equal(favouritenSortenIds(viele, viele).length, 50);
  assert.deepEqual(favouritenSortenIds([], []), []);
});

test("Favourites: Jury-Bewertungen sichtbar, nach Datum, ohne Bilder", () => {
  const q = readFileSync("lib/query/jury.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function ladeJuryFavourites"), q.indexOf("export async function ladeJuryTeam"));
  assert.match(teil, /phase: "BEENDET"/);
  assert.match(teil, /istGewinner: true/);
  assert.match(teil, /freigegeben: true/);
  assert.match(teil, /autor: \{ jury: true \}/);
  assert.match(teil, /orderBy: \{ erstelltAm: "desc" \}/);
  assert.doesNotMatch(teil, /bilder:|gesamtnote/);
});
