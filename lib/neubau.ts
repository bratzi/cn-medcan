import "server-only";

import { after } from "next/server";

import { anfrageKontext, deployHookUrl, getEnv } from "@/lib/cloudflare";
import { NEUBAU_JE_TAG, erstesMal, neubauAnstossen } from "@/lib/neubau-kern";

export { NEUBAU_JE_TAG, neubauAnstossen };

/**
 * Je Request (ExecutionContext) höchstens ein Neubau. `cache()` taugt dafür nicht: ohne React-Dispatcher
 * (Route Handler, Server Action nach dem ersten await) merkt es sich nichts.
 */
const vorgemerkt = new WeakSet<object>();

export function neubauVormerken(): void {
  try {
    if (!erstesMal(vorgemerkt, anfrageKontext())) return;
    after(async () => {
      try {
        const url = deployHookUrl();
        if (!url) return; // lokal und in Tests ohne Secret
        const { DB } = await getEnv();
        await neubauAnstossen({
          heute: () => new Date().toISOString().slice(0, 10),
          zaehle: async (tag) =>
            (
              await DB.prepare(
                "INSERT INTO neubau_zaehler (tag, anzahl) VALUES (?1, 1) ON CONFLICT(tag) DO UPDATE SET anzahl = anzahl + 1 RETURNING anzahl",
              )
                .bind(tag)
                .first<{ anzahl: number }>()
            )?.anzahl ?? 1,
          sende: () => fetch(url, { method: "POST" }),
        });
      } catch (fehler) {
        console.error("neubau", fehler);
      }
    });
  } catch (fehler) {
    // Außerhalb eines Requests (Tests, Skripte) gibt es kein after(): Neubau nicht vormerken, nie werfen.
    console.error("neubau: nicht vorgemerkt", fehler);
  }
}
