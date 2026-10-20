import { NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { d1Ziel, sotmTakt } from "@/lib/sotm/takt";

/** Takt des Strain of the Month: Cron (worker.mjs) und Fallback von /sotm. Führt nur Fälliges aus. */
export async function POST() {
  try {
    const { DB } = await getEnv();
    const { schritte } = await sotmTakt(d1Ziel(DB), new Date());
    if (schritte.length > 0) {
      revalidiereSprachen("/");
      revalidiereSprachen("/sotm");
      revalidiereSprachen("/admin");
    }
    return NextResponse.json({ schritte });
  } catch (fehler) {
    console.error("sotm-takt", fehler);
    return NextResponse.json({ fehler: "Takt fehlgeschlagen" }, { status: 500 });
  }
}
