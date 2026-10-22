import { NextResponse } from "next/server";

import { igSchluesselOk } from "@/lib/ig-schluessel";
import { igReviews } from "@/lib/query/ig-feed";

/**
 * Öffentlicher JSON-Feed für die Instagram-Pflege in Cowork (Nutzer 2026-10-14).
 * Keine Sitzung, keine personenbezogenen Daten: nur freigegebene Betreiber-Reviews,
 * wie die Website sie ohnehin zeigt. Umfragen bleiben vorerst außen vor (Nutzer 2026-10-14);
 * `igUmfragen` steht bereit, falls sie zurückkommen.
 */
export async function GET(anfrage: Request) {
  // Ohne Passwortschranke (2026-10-22) prüft die Route ihren Schlüssel selbst.
  if (!(await igSchluesselOk(anfrage))) return Response.json({ fehler: "kein Zugriff" }, { status: 401 });
  const ursprung = new URL(anfrage.url).origin;
  const reviews = await igReviews(ursprung);
  return NextResponse.json(
    {
      stand: new Date().toISOString(),
      reviews,
      hinweis: "Nur Aroma, Aussehen, Charge. Keine Aussagen zur Wirkung (HWG).",
    },
    { headers: { "Cache-Control": "public, max-age=900" } },
  );
}
