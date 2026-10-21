// Eigener Einstieg vor OpenNexts Worker (wrangler.jsonc, "main").
//
// OpenNext laedt den Next-Server erst in der ersten Anfrage je Isolat
// (`await import(".../handler.mjs")` im fetch-Handler). Das kostete live rund
// 115 ms CPU und zaehlte auf das 10-ms-Limit des Free-Plans je Anfrage; ab dem
// 2026-10-08 brach Cloudflare solche Anfragen zeitweise mit Error 1102 ab.
//
// Hier startet derselbe Import schon beim Laden des Isolats. Die Startphase hat
// ein eigenes Budget (1 s). Der fetch-Handler wartet danach auf dasselbe, bereits
// ausgewertete Modul. Der Import laeuft ohne I/O durch (Konfiguration und Module
// laden), darum ist er vor der ersten Anfrage fertig.
import worker from "./.open-next/worker.js";

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

// Fehler hier nicht schlucken wollen, aber auch keinen unbehandelten Fehler beim
// Start: die erste Anfrage stoesst auf denselben Fehler und meldet ihn.
import("./.open-next/server-functions/default/handler.mjs").catch(() => {});

// Dateien unter /_next/static/ liefert Cloudflare direkt aus. Was davon den
// Worker erreicht, stammt aus einem frueheren Deploy (offener Tab, alter Chunk)
// und existiert nicht mehr. Next brauchte fuer dieses 404 live rund 79 ms CPU;
// hier kostet es fast nichts. Der Browser laedt die Seite dann neu.
const einstieg = {
  ...worker,
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith("/_next/static/")) {
      return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return worker.fetch(request, env, ctx);
  },

  // Zwei Takte: Strain of the Month am 1. und 15. um 00:00 UTC (die Route fuehrt nur Faelliges aus),
  // taeglicher Neubau der Leseseiten um 03:00 UTC ueber den Deploy-Hook (Spec 2026-10-21).
  async scheduled(controller, env, ctx) {
    if (controller.cron === "0 3 * * *") {
      if (!env.DEPLOY_HOOK_URL) {
        console.warn("neubau-cron: DEPLOY_HOOK_URL fehlt");
        return;
      }
      ctx.waitUntil(
        fetch(env.DEPLOY_HOOK_URL, { method: "POST" }).then(async (antwort) => {
          if (!antwort.ok) console.error("neubau-cron", antwort.status, await antwort.text());
          else await antwort.body?.cancel();
        }).catch((fehler) => console.error("neubau-cron", fehler)),
      );
      return;
    }
    ctx.waitUntil(
      env.WORKER_SELF_REFERENCE.fetch("https://cn-medcan.intern/api/sotm/takt", { method: "POST" }).then(async (antwort) => {
        if (!antwort.ok) console.error("sotm-cron", antwort.status, await antwort.text());
      }).catch((fehler) => console.error("sotm-cron", fehler)),
    );
  },
};

export default einstieg;
