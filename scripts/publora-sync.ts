/**
 * Publora-Posts in den Admin-Kalender spiegeln (Spec 2026-10-16 Admin-Dashboard).
 *   npx tsx scripts/publora-sync.ts
 * Braucht PUBLORA_API_KEY, IG_FEED_URL, IG_FEED_KEY (wie die IG-Routine). Fehler: Abbruch ohne Wiederholung.
 */
import { publoraZeilen, SYNC_MAX } from "../lib/publora-sync";
import { feedSchluessel, publoraPosts, umgebung } from "./ig-gemeinsam";

async function main() {
  const env = umgebung();
  const zeilen = publoraZeilen(await publoraPosts()).slice(0, SYNC_MAX);
  const ziel = new URL("/api/publora-sync", env.IG_FEED_URL);
  ziel.searchParams.set("key", feedSchluessel(env));
  const antwort = await fetch(ziel, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posts: zeilen }) });
  if (!antwort.ok) throw new Error(`Sync ${antwort.status}: ${await antwort.text()}`);
  console.log(`Publora-Spiegel: ${zeilen.length} Posts`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
