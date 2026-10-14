/**
 * Lagebericht für den Instagram-Agenten (Spec 2026-10-14 Themen-Agent): liest alle Publora-Posts und
 * gibt als JSON aus, welche Themen-Entwürfe offen sind, welche veröffentlicht wurden und welche Marken
 * zuletzt vorkamen. Ändert nichts.
 *   npx tsx scripts/ig-lage.ts
 */
import { markenAus, publoraPosts } from "./ig-gemeinsam";

type Post = { status?: string; createdAt?: string; mediaUrls?: unknown };

async function main() {
  const posts = (await publoraPosts()) as Post[];
  const zeilen = posts
    .map((p) => ({ status: p.status ?? "?", erstellt: p.createdAt ?? "", marke: [...markenAus([p])][0] ?? "" }))
    .sort((a, b) => b.erstellt.localeCompare(a.erstellt));
  const themen = zeilen.filter((z) => z.marke.startsWith("bot-thema-"));
  console.log(
    JSON.stringify(
      {
        offeneThemenEntwuerfe: themen.filter((z) => z.status === "draft").map((z) => z.marke),
        veroeffentlichteThemen: themen.filter((z) => z.status === "published").map((z) => z.marke),
        letzteMarken: zeilen.slice(0, 20).map((z) => `${z.marke} (${z.status})`),
      },
      null,
      2,
    ),
  );
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
