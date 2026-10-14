import { NextResponse } from "next/server";

import { igReviews, igUmfragen } from "@/lib/query/ig-feed";

/**
 * Öffentlicher JSON-Feed für die Instagram-Pflege in Cowork (Nutzer 2026-10-14).
 * Keine Sitzung, keine personenbezogenen Daten: nur freigegebene Betreiber-Reviews
 * und beendete Umfragen, wie die Website sie ohnehin zeigt.
 */
export async function GET(anfrage: Request) {
  const ursprung = new URL(anfrage.url).origin;
  const [reviews, umfragen] = await Promise.all([igReviews(ursprung), igUmfragen(ursprung)]);
  return NextResponse.json(
    {
      stand: new Date().toISOString(),
      reviews,
      umfragen,
      hinweis: "Nur Aroma, Aussehen, Charge. Keine Aussagen zur Wirkung (HWG).",
    },
    { headers: { "Cache-Control": "public, max-age=900" } },
  );
}
