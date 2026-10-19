import { NextResponse } from "next/server";

import { igSchluesselOk } from "@/lib/ig-schluessel";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { syncAnweisungen, syncPruefen, type PubloraZeile } from "@/lib/publora-sync";
import { getEnv } from "@/lib/cloudflare";

/** Publora-Spiegel ersetzen (Spec 2026-10-16 Admin-Dashboard). Gleicher Schlüssel wie /api/jury-ig. */
export async function POST(anfrage: Request) {
  if (!(await igSchluesselOk(anfrage))) return NextResponse.json({ fehler: "kein Zugriff" }, { status: 401 });
  const body: unknown = await anfrage.json().catch(() => null);
  const fehler = syncPruefen(body);
  if (fehler.length) return NextResponse.json({ fehler }, { status: 400 });
  const posts = (body as { posts: PubloraZeile[] }).posts;
  const jetzt = new Date().toISOString();
  const { DB } = await getEnv();
  // Ganz oder gar nicht: D1-Batch läuft als eine Transaktion (Prisma $transaction auf D1 nicht).
  await DB.batch(syncAnweisungen(posts, jetzt).map((a) => DB.prepare(a.sql).bind(...a.params)));
  revalidiereSprachen("/admin");
  return NextResponse.json({ ok: true, zeilen: posts.length });
}
