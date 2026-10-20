import { test } from "node:test";
import assert from "node:assert/strict";
import { netzVersatz } from "@/lib/aromakarte";

// Netz-Beschriftung liegt außen am Punkt: oben über, rechts rechts davon, links links davon.
test("netzVersatz schiebt die Beschriftung nach außen", () => {
  assert.deepEqual(netzVersatz(0), { x: -50, y: -100 });
  const rechts = netzVersatz(2); // 54° rechts unten-ish
  assert.ok(rechts.x > -30, "rechte Achse wächst nach rechts");
  const links = netzVersatz(8);
  assert.ok(links.x < -70, "linke Achse wächst nach links");
  assert.equal(netzVersatz(5).y, 0);
});
