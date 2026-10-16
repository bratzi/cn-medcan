import { NextResponse, type NextRequest } from "next/server";

import { ladeSortenSuche } from "@/lib/query/sorten-explorer";
import { normalisiereSuche } from "@/lib/sorten-suche";

const OEFFENTLICH = { "Cache-Control": "public, s-maxage=3600" } as const;

/**
 * Sortensuche des Explorers auf der Startseite: dieselben öffentlichen Daten wie der Explorer,
 * ohne Mitglied und ohne Note (HWG). Ab zwei Zeichen, höchstens zwölf Treffer, eine Stunde im Cache.
 */
export async function GET(anfrage: NextRequest) {
  const text = normalisiereSuche(anfrage.nextUrl.searchParams.get("q"));
  if (!text) return NextResponse.json({ sorten: [] }, { headers: OEFFENTLICH });
  return NextResponse.json({ sorten: await ladeSortenSuche(text) }, { headers: OEFFENTLICH });
}
