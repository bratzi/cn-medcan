import { test } from "node:test";
import assert from "node:assert/strict";

import { keineLeseseiten, planeVerschiebung } from "../scripts/seiten-in-assets.mjs";

test("planeVerschiebung: Leseseiten nach _seiten, Rest bleibt", () => {
  const plan = planeVerschiebung([
    "de.html",
    "en/blueten.html",
    "de/blueten/mac-1/standard.html",
    "de/blueten/mac-1/v-x-alle.html",
    "de/jury/seite/2.html",
    "de/admin.html",
    "de/impressum.html",
    "_not-found.html",
  ]);
  assert.deepEqual(plan, [
    { quelle: "de.html", ziel: "_seiten/de/index.html" },
    { quelle: "en/blueten.html", ziel: "_seiten/en/blueten/index.html" },
    { quelle: "de/blueten/mac-1/standard.html", ziel: "_seiten/de/blueten/mac-1/standard.html" },
    { quelle: "de/blueten/mac-1/v-x-alle.html", ziel: "_seiten/de/blueten/mac-1/v-x-alle.html" },
    { quelle: "de/jury/seite/2.html", ziel: "_seiten/de/jury/seite/2/index.html" },
  ]);
});

test("keineLeseseiten: nur im Workers Build ein Fehler", () => {
  assert.equal(keineLeseseiten({ WORKERS_CI: "1" }, 0), true);
  assert.equal(keineLeseseiten({ WORKERS_CI: "1" }, 5), false);
  assert.equal(keineLeseseiten({}, 0), false);
});
