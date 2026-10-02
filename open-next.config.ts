import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cache fuer statische Seiten (Spec docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md, 4.4).
 *
 * - KV statt R2: das Projekt bleibt kostenfrei, die Free-Grenzen sind hart.
 * - Regional Cache (Cache API) vor KV spart KV-Lesezugriffe. Ohne Nachladen bei
 *   jedem Treffer: das kostete je Aufruf einen KV-Lesezugriff und CPU im
 *   waitUntil, und CPU ist hier der Engpass (Fehler 1102).
 * - memoryQueue fuer die zeitbasierte Revalidierung ueber das Service-Binding
 *   WORKER_SELF_REFERENCE; keine Durable Objects.
 * - Kein Tag-Cache: es wird nur nach Zeit revalidiert.
 * - Cache-Interception liefert Treffer, ohne den Next-Server zu laden. Der
 *   Proxy (Passwort-Gate) laeuft vorher (OpenNext core/routingHandler.js).
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: false,
  }),
  queue: memoryQueue,
  enableCacheInterception: true,
});
