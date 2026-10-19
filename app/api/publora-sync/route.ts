import { NextResponse } from "next/server";

import { igSchluesselOk } from "@/lib/ig-schluessel";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { syncPruefen, type PubloraZeile } from "@/lib/publora-sync";
import { getPrisma } from "@/lib/prisma";

/** Publora-Spiegel ersetzen (Spec 2026-10-16 Admin-Dashboard). Gleicher Schlüssel wie /api/jury-ig. */
export async function POST(anfrage: Request) {
  if (!(await igSchluesselOk(anfrage))) return NextResponse.json({ fehler: "kein Zugriff" }, { status: 401 });
  const body: unknown = await anfrage.json().catch(() => null);
  const fehler = syncPruefen(body);
  if (fehler.length) return NextResponse.json({ fehler }, { status: 400 });
  const posts = (body as { posts: PubloraZeile[] }).posts;
  const jetzt = new Date().toISOString();
  const prisma = await getPrisma();
  // Ganz oder gar nicht: löschen, einfügen, Stand setzen in einer Transaktion.
  await prisma.$transaction([
    prisma.publoraPost.deleteMany({}),
    ...posts.map((p) => prisma.publoraPost.create({ data: { ...p, abgerufenAm: jetzt } })),
    prisma.syncStand.upsert({ where: { schluessel: "publora" }, create: { schluessel: "publora", stand: jetzt }, update: { stand: jetzt } }),
  ]);
  revalidiereSprachen("/admin");
  return NextResponse.json({ ok: true, zeilen: posts.length });
}
