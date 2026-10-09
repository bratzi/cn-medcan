import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

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
 * - D1-Tag-Cache (Binding NEXT_TAG_CACHE_D1, Datenbank cn-medcan-tags, Session 54):
 *   revalidatePath wirkt jetzt auf den KV-Cache. Speichern einer Bewertung baut
 *   Startseite und /reviews neu; zeitbasiert nur noch einmal am Tag.
 * - Cache-Interception liefert Treffer, ohne den Next-Server zu laden. Der
 *   Proxy (Passwort-Gate) laeuft vorher (OpenNext core/routingHandler.js).
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
  tagCache: d1NextTagCache,
  enableCacheInterception: true,
});
