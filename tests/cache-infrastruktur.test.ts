import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.4: ISR braucht KV, das Service-Binding fuer die
// Revalidierung und die OpenNext-Konfiguration zusammen, sonst faellt der Cache im Worker
// still aus (edge-stack-master, Abschnitt 6).
test("ISR-Infrastruktur: KV, Service-Binding und OpenNext-Konfiguration gehören zusammen", () => {
  const wrangler = lies("wrangler.jsonc");
  assert.match(wrangler, /"binding": "NEXT_INC_CACHE_KV",\s*"id": "[0-9a-f]{32}"/);
  assert.match(wrangler, /"binding": "WORKER_SELF_REFERENCE",\s*"service": "cn-medcan"/);
  assert.doesNotMatch(wrangler, /r2_buckets|durable_objects/);

  const config = lies("open-next.config.ts");
  assert.match(config, /incrementalCache: kvIncrementalCache,/);
  assert.doesNotMatch(config, /withRegionalCache/);
  assert.match(config, /queue: memoryQueue/);
  assert.match(config, /enableCacheInterception: true/);
  assert.doesNotMatch(config, /r2IncrementalCache|doQueue|tagCache/);
});

test("next typegen startet kein lokales workerd", () => {
  assert.match(
    lies("next.config.ts"),
    /if \(process\.env\.NODE_ENV === "development"\) void initOpenNextCloudflareForDev\(\);/,
  );
});
