import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { istOhneGate } from "@/lib/proxy-regeln";

test("Cron: zwei Termine, Handler ruft die Route über das Service-Binding", () => {
  const w = readFileSync("wrangler.jsonc", "utf8");
  assert.match(w, /"0 0 1 \* \*"/);
  assert.match(w, /"0 0 15 \* \*"/);
  const e = readFileSync("worker.mjs", "utf8");
  assert.match(e, /scheduled\s*\(/);
  assert.match(e, /WORKER_SELF_REFERENCE\.fetch\([^)]*\/api\/sotm\/takt/);
});

test("Route revalidiert Start, SOTM und Admin nur bei Änderung", () => {
  const r = readFileSync("app/api/sotm/takt/route.ts", "utf8");
  assert.match(r, /export async function POST/);
  assert.match(r, /schritte\.length > 0/);
  for (const p of ['"/"', '"/sotm"', '"/admin"']) assert.ok(r.includes(`revalidiereSprachen(${p}`), p);
});

test("Takt-Route ist ohne Passwort erreichbar (Service-Binding, Browser-Fallback), Nachbarn bleiben gesperrt", () => {
  assert.equal(istOhneGate("/api/sotm/takt"), true);
  for (const pfad of ["/api/sotm", "/api/sotm/andere", "/sotm", "/api/sotm-takt"]) {
    assert.equal(istOhneGate(pfad), false, pfad);
  }
});
