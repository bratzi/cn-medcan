import { test } from "node:test";
import assert from "node:assert/strict";
import { publoraZeilen, SYNC_MAX, syncAnweisungen, syncPruefen } from "@/lib/publora-sync";

const JETZT = new Date("2026-10-16T10:00:00Z");
const url = (n: string) => `https://cdn.publora.com/x/1729-${n}`;

test("Art aus Medien und Marke", () => {
  const z = publoraZeilen([
    { id: "1", postGroupId: "g1", status: "scheduled", scheduledTime: "2026-10-20T17:00:00Z", content: "So bewerten wir\nmehr", mediaUrls: [url("bot-k-a-1.png"), url("bot-k-a-2.png")] },
    { id: "2", postGroupId: "g2", status: "draft", mediaUrls: [url("bot-r-x.mp4")] },
    { id: "3", postGroupId: "g3", status: "draft", mediaUrls: [url("bot-story-r-x.mp4")] },
    { id: "4", postGroupId: "g4", status: "published", scheduledTime: "2026-10-15T17:00:00Z", mediaUrls: [url("abc.png")] },
  ], JETZT);
  assert.deepEqual(z.map((x) => x.art), ["karussell", "reel", "story", "bild"]);
  assert.equal(z[0].titel, "So bewerten wir");
  assert.equal(z[0].plattform, "instagram");
});

test("fehlende Felder: Zeile bleibt, kein Absturz", () => {
  const [z] = publoraZeilen([{ postGroupId: "g9" }], JETZT);
  assert.deepEqual(z, { id: "g9", gruppe: "g9", plattform: "instagram", art: "bild", status: "unbekannt", geplantAm: null, titel: "" });
  assert.deepEqual(publoraZeilen([null, 3, "x", {}], JETZT), []);
});

test("Titel max 120 Zeichen, älter als 30 Tage fliegt, Doppel-Id einmal", () => {
  const z = publoraZeilen([
    { id: "a", postGroupId: "g", status: "published", scheduledTime: "2026-09-01T10:00:00Z", content: "alt" },
    { id: "b", postGroupId: "g", status: "draft", content: "x".repeat(200) },
    { id: "b", postGroupId: "g", status: "draft", content: "doppelt" },
  ], JETZT);
  assert.equal(z.length, 1);
  assert.equal(z[0].titel.length, 120);
});

test("syncPruefen", () => {
  const ok = { id: "1", gruppe: "g", plattform: "instagram", art: "reel", status: "draft", geplantAm: null, titel: "" };
  assert.deepEqual(syncPruefen({ posts: [ok] }), []);
  assert.ok(syncPruefen(null).length > 0);
  assert.ok(syncPruefen({ posts: "x" }).length > 0);
  assert.ok(syncPruefen({ posts: Array(SYNC_MAX + 1).fill(ok) }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, status: "boom" }] }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, art: "video" }] }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, geplantAm: "morgen" }] }).length > 0);
});

test("syncPruefen: doppelte Id wird abgelehnt", () => {
  const ok = { id: "1", gruppe: "g", plattform: "instagram", art: "reel", status: "draft", geplantAm: null, titel: "" };
  assert.ok(syncPruefen({ posts: [ok, { ...ok }] }).length > 0);
  assert.deepEqual(syncPruefen({ posts: [ok, { ...ok, id: "2" }] }), []);
});

test("syncAnweisungen: leeren, einfügen, Stand setzen mit Spalten der Migration", () => {
  const z = { id: "1", gruppe: "g", plattform: "instagram", art: "reel" as const, status: "draft", geplantAm: null, titel: "t" };
  const a = syncAnweisungen([z], "2026-10-16T10:00:00.000Z");
  assert.equal(a.length, 3);
  assert.equal(a[0].sql, "DELETE FROM publora_post");
  assert.match(a[1].sql, /INSERT INTO publora_post \(id, gruppe, plattform, art, status, geplant_am, titel, abgerufen_am\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)/);
  assert.deepEqual(a[1].params, ["1", "g", "instagram", "reel", "draft", null, "t", "2026-10-16T10:00:00.000Z"]);
  assert.match(a[2].sql, /ON CONFLICT\(schluessel\) DO UPDATE SET stand = excluded\.stand/);
  assert.deepEqual(a[2].params, ["publora", "2026-10-16T10:00:00.000Z"]);
});