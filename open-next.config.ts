import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Gegen Fehler 1102 (Free-Plan, 10 ms CPU): beim Build vorgerenderte Seiten
// (z. B. /zugang) kommen per Cache-Interception direkt aus den Static Assets,
// ohne den Next-Server zu laden. Keine Bindings, keine Kosten, keine
// Revalidierung (die Datenseiten bleiben dynamisch). Spec Caching 2026-09-25.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
