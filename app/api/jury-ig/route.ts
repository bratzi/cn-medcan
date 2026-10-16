import { NextResponse } from "next/server";

import { igMeldungPruefen, type IgMeldung } from "@/lib/ig-jury";
import { igSchluesselOk } from "@/lib/ig-schluessel";
import { juryIgSetzen } from "@/lib/query/jury-feed";

/** Meldung der Instagram-Routine: Status und Adresse eines Jury-Beitrags (Task 9). Gleicher Schlüssel wie der Feed. */
export async function POST(anfrage: Request) {
  if (!(await igSchluesselOk(anfrage))) return NextResponse.json({ fehler: "kein Zugriff" }, { status: 401 });
  const body: unknown = await anfrage.json().catch(() => null);
  const fehler = igMeldungPruefen(body);
  if (fehler.length) return NextResponse.json({ fehler }, { status: 400 });
  const m = body as IgMeldung;
  const ok = await juryIgSetzen(m.slug, m.igStatus, m.igStatus === "VEROEFFENTLICHT" ? (m.igUrl ?? null) : null);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ fehler: "Beitrag nicht gefunden" }, { status: 404 });
}
