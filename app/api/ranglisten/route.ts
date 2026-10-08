import { NextResponse, type NextRequest } from "next/server";

import { ladeRangliste } from "@/lib/query/rangliste";
import { parameter } from "@/lib/rangliste";
import { aktuellesMitglied } from "@/lib/session";

const PRIVAT = { "Cache-Control": "private, no-store" } as const;

/**
 * Ranglisten je Sorte, nur für angemeldete Mitglieder (Spec Bewertungsbuch 5,
 * §10 HWG). /reviews bleibt statisch; die Insel fragt hier im Browser nach.
 */
export async function GET(anfrage: NextRequest) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) return NextResponse.json({ fehler: "anmelden" }, { status: 401, headers: PRIVAT });
  const { nach, seite } = parameter(anfrage.nextUrl.searchParams.get("nach"), anfrage.nextUrl.searchParams.get("seite"));
  return NextResponse.json(await ladeRangliste(nach, seite), { headers: PRIVAT });
}
