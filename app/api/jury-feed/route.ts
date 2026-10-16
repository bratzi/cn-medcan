import { NextResponse } from "next/server";

import { igSchluesselOk } from "@/lib/ig-schluessel";
import { juryFeed } from "@/lib/query/jury-feed";

/**
 * Feed der Terpz-Jury für die Instagram-Routine (Task 9): veröffentlichte Beiträge, die noch nicht auf
 * Instagram stehen. Nur öffentliche Felder, keine Aussagen zur Wirkung (HWG), nie gecacht.
 */
export async function GET(anfrage: Request) {
  if (!(await igSchluesselOk(anfrage))) return NextResponse.json({ fehler: "kein Zugriff" }, { status: 401 });
  const beitraege = await juryFeed(new URL(anfrage.url).origin);
  return NextResponse.json({ stand: new Date().toISOString(), beitraege }, { headers: { "Cache-Control": "no-store" } });
}
