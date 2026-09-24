import { test } from "node:test";
import assert from "node:assert/strict";

import { rundenZeitraum } from "@/components/umfrage/zeitraum";

test("Runde mit Ende: von bis, ohne Gedankenstrich", () => {
  assert.equal(
    rundenZeitraum(new Date("2026-09-12T12:00:00Z"), new Date("2026-09-24T12:00:00Z")),
    "12.09.2026 bis 24.09.2026",
  );
});

test("Runde ohne Ende: seit", () => {
  assert.equal(rundenZeitraum(new Date("2026-09-12T12:00:00Z"), null), "seit 12.09.2026");
});
