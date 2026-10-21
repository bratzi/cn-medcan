import "server-only";

import { after } from "next/server";
import { cache } from "react";

import { deployHookUrl, getEnv } from "@/lib/cloudflare";
import { NEUBAU_JE_TAG, neubauAnstossen } from "@/lib/neubau-kern";

export { NEUBAU_JE_TAG, neubauAnstossen };

/** Je Request ein Objekt: mehrere revalidiereSprachen-Aufrufe einer Aktion lösen einen Neubau aus. */
const vorgemerkt = cache(() => ({ ja: false }));

export function neubauVormerken(): void {
  try {
    const merker = vorgemerkt();
    if (merker.ja) return;
    merker.ja = true;
    after(async () => {
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
      }).catch((fehler) => console.error("neubau", fehler));
    });
  } catch (fehler) {
    // Außerhalb eines Requests (Tests, Skripte) gibt es kein after(): Neubau nicht vormerken, nie werfen.
    console.error("neubau: nicht vorgemerkt", fehler);
  }
}
