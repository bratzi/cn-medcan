import { test, mock } from "node:test";
import assert from "node:assert/strict";

import { merke, vergiss } from "@/lib/memo";

test("merke: Treffer innerhalb der TTL ruft den Lader nicht erneut", async () => {
  let aufrufe = 0;
  const lader = async () => ++aufrufe;
  assert.equal(await merke("t1:a", 1000, lader), 1);
  assert.equal(await merke("t1:a", 1000, lader), 1);
  assert.equal(aufrufe, 1);
});

test("merke: nach Ablauf wird neu geladen", async () => {
  mock.timers.enable({ apis: ["Date"], now: 0 });
  try {
    let aufrufe = 0;
    const lader = async () => ++aufrufe;
    await merke("t2:a", 1000, lader);
    mock.timers.tick(1001);
    assert.equal(await merke("t2:a", 1000, lader), 2);
  } finally {
    mock.timers.reset();
  }
});

test("merke: Fehler wird nicht gemerkt", async () => {
  await assert.rejects(merke("t3:a", 1000, async () => { throw new Error("weg"); }));
  assert.equal(await merke("t3:a", 1000, async () => "da"), "da");
});

test("merke: mehr als 64 Schluessel - der aelteste fliegt", async () => {
  vergiss("");
  for (let i = 0; i < 65; i++) await merke(`t4:${i}`, 60_000, async () => i);
  let neu = false;
  await merke("t4:0", 60_000, async () => { neu = true; return -1; });
  assert.equal(neu, true);
  let neu64 = false;
  await merke("t4:64", 60_000, async () => { neu64 = true; return -1; });
  assert.equal(neu64, false);
});

test("vergiss: entfernt nur den Praefix", async () => {
  await merke("katalog:x", 60_000, async () => 1);
  await merke("reviews:x", 60_000, async () => 1);
  vergiss("katalog:");
  let k = false;
  let r = false;
  await merke("katalog:x", 60_000, async () => { k = true; return 2; });
  await merke("reviews:x", 60_000, async () => { r = true; return 2; });
  assert.equal(k, true);
  assert.equal(r, false);
});
