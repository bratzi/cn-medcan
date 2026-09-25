import { NextResponse } from "next/server";

import { ungeleseneAnzahl } from "@/lib/query/benachrichtigungen";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Anzahl ungelesener Benachrichtigungen fuer den Zaehler im Kopf. Der Kopf
 * liest bewusst keine Sitzung (sonst waere jede Seite dynamisch); er fragt
 * hier im Browser nach. Ohne Anmeldung 0, nie ein Fehler.
 */
export async function GET() {
  const mitglied = await aktuellesMitglied();
  const ungelesen = mitglied ? await ungeleseneAnzahl(mitglied.mitgliedId) : 0;
  return NextResponse.json({ ungelesen }, { headers: { "Cache-Control": "private, no-store" } });
}
