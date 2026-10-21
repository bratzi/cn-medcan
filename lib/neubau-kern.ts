/** Höchstens so viele Neubauten am Tag aus Änderungen; dazu einer täglich per Cron (Spec 2026-10-21, 3.4). */
export const NEUBAU_JE_TAG = 15;

/** Reiner Kern ohne Next- und Cloudflare-Importe, damit er ohne Worker testbar ist. */
export async function neubauAnstossen(deps: {
  zaehle: (tag: string) => Promise<number>;
  sende: () => Promise<Response>;
  heute: () => string;
}) {
  const anzahl = await deps.zaehle(deps.heute());
  if (anzahl > NEUBAU_JE_TAG) return "deckel" as const;
  const antwort = await deps.sende();
  if (!antwort.ok) {
    console.error("neubau: Deploy-Hook", antwort.status, await antwort.text());
    return "fehler" as const;
  }
  return "gesendet" as const;
}
