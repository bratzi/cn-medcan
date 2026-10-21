/** Höchstens so viele Neubauten am Tag aus Änderungen; dazu einer täglich per Cron (Spec 2026-10-21, 3.4). */
export const NEUBAU_JE_TAG = 5;

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
  await antwort.body?.cancel();
  return "gesendet" as const;
}

/**
 * Dedupe je Request: `true` beim ersten Mal für dieses Schlüsselobjekt (der Request-Kontext), sonst `false`.
 * Ohne Schlüsselobjekt (Tests, außerhalb eines Requests) gibt es nichts zu merken: `true`.
 */
export function erstesMal(gesehen: WeakSet<object>, schluessel: object | null): boolean {
  if (!schluessel) return true;
  if (gesehen.has(schluessel)) return false;
  gesehen.add(schluessel);
  return true;
}
