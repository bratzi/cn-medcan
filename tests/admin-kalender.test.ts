import { test } from "node:test";
import assert from "node:assert/strict";
import { berlinTag, kalenderBauen, ueberfaellig } from "@/lib/admin-kalender";
import type { PubloraZeile } from "@/lib/publora-sync";

const JETZT = new Date("2026-10-16T10:00:00Z");
const z = (id: string, status: string, geplantAm: string | null): PubloraZeile => ({ id, gruppe: id, plattform: "instagram", art: "reel", status, geplantAm, titel: id });

test("berlinTag über Sommerzeitwechsel", () => {
  assert.equal(berlinTag("2026-10-25T23:30:00Z"), "2026-10-26");
  assert.equal(berlinTag("2026-10-24T22:30:00Z"), "2026-10-25");
});

test("kommend 14 Tage nach Tag, Entwürfe max 10, vergangen 7 Tage veröffentlicht", () => {
  const zeilen = [
    z("a", "scheduled", "2026-10-20T17:00:00Z"),
    z("b", "scheduled", "2026-10-20T16:00:00Z"),
    z("c", "scheduled", "2026-11-05T17:00:00Z"), // > 14 Tage
    z("d", "published", "2026-10-15T17:00:00Z"),
    z("e", "published", "2026-10-01T17:00:00Z"), // > 7 Tage zurück
    z("f", "failed", "2026-10-15T17:00:00Z"),
    ...Array.from({ length: 12 }, (_, i) => z(`e${i}`, "draft", null)),
  ];
  const k = kalenderBauen(zeilen, "2026-10-16T04:00:00Z", JETZT);
  assert.deepEqual(k.kommend.map((t) => [t.tag, t.posts.map((p) => p.id)]), [["2026-10-20", ["b", "a"]]]);
  assert.equal(k.entwuerfe.length, 10);
  assert.equal(k.entwuerfeGesamt, 12);
  assert.deepEqual(k.vergangen.map((p) => p.id), ["d", "f"]);
  assert.equal(k.veraltet, false);
});

test("überfällige scheduled-Posts erscheinen unter vergangen", () => {
  const zeilen = [
    z("h", "scheduled", "2026-10-15T17:00:00Z"), // überfällig
    z("i", "scheduled", "2026-10-01T17:00:00Z"), // älter als 7 Tage
    z("j", "scheduled", "2026-10-20T17:00:00Z"), // kommend
  ];
  const k = kalenderBauen(zeilen, "2026-10-16T04:00:00Z", JETZT);
  assert.deepEqual(k.vergangen.map((p) => p.id), ["h"]);
  assert.deepEqual(k.kommend.flatMap((t) => t.posts.map((p) => p.id)), ["j"]);
  assert.equal(ueberfaellig(zeilen[0], JETZT), true);
  assert.equal(ueberfaellig(zeilen[2], JETZT), false);
  assert.equal(ueberfaellig(z("p", "published", "2026-10-15T17:00:00Z"), JETZT), false);
});

test("veraltet ohne Stand oder nach 48 h", () => {
  assert.equal(kalenderBauen([], null, JETZT).veraltet, true);
  assert.equal(kalenderBauen([], "2026-10-14T09:59:00Z", JETZT).veraltet, true);
  assert.equal(kalenderBauen([], "2026-10-14T10:01:00Z", JETZT).veraltet, false);
});
