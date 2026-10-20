import { unstable_cache } from "next/cache";

import { ladeAromaVorzeige } from "@/lib/query/strains";

/** Je Sorte gecacht; Bewertungen und Strains invalidieren über den Tag (lib/katalog/revalidieren.ts). */
const aromaJeSorte = unstable_cache((sorte: string) => ladeAromaVorzeige(sorte), ["aroma-sorte-v1"], {
  revalidate: 3600,
  tags: ["katalog"],
});

const SLUG = /^[a-z0-9-]{1,120}$/;

/**
 * Aroma-Karte der Startseite für eine Sorte (Nutzer 2026-10-20: Katalog steuert Bewertung):
 * die Blüte der Sorte mit den meisten freigegebenen Bewertungen. Öffentlich, ohne Sitzung,
 * ohne Preise. Unbekannt oder ohne Bewertung: 404, die Karte zeigt dann „noch nicht bewertet“.
 */
export async function GET(_anfrage: Request, { params }: { params: Promise<{ sorte: string }> }): Promise<Response> {
  const { sorte } = await params;
  const daten = SLUG.test(sorte) ? await aromaJeSorte(sorte) : null;
  const headers = { "cache-control": "public, max-age=300" };
  if (!daten) return Response.json({ fehler: "unbekannt" }, { status: 404, headers });
  return Response.json(daten, { headers });
}
