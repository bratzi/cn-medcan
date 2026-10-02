import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cache fuer statische Seiten (Spec docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md, 4.4).
 *
 * - KV statt R2: das Projekt bleibt kostenfrei, die Free-Grenzen sind hart.
 * - Kein Regional Cache: die Cache API wirkt auf *.workers.dev nicht
 *   (Cloudflare-Doku: nur Custom Domains). Der Wrapper kostete dort je
 *   Treffer einen KV-Lesezugriff plus CPU fuer nichts. Mit eigener Domain
 *   neu pruefen.
 * - memoryQueue fuer die zeitbasierte Revalidierung ueber das Service-Binding
 *   WORKER_SELF_REFERENCE; keine Durable Objects.
 * - Kein Tag-Cache: es wird nur nach Zeit revalidiert.
 * - Cache-Interception liefert Treffer, ohne den Next-Server zu laden. Der
 *   Proxy (Passwort-Gate) laeuft vorher (OpenNext core/routingHandler.js).
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});
