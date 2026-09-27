/**
 * Geteilte, nutzerunabhaengige Daten pro Isolat merken (Spec Caching v2, Stufe B).
 * Nur aufgeloeste Werte, nie eine offene Promise ueber Request-Grenzen (workerd-I/O-Regel).
 * Nie Sitzung, Rolle als Wert oder Cookies hier hinein - Rolle nur als Teil des Schluessels.
 */
const MAX_EINTRAEGE = 64;
const speicher = new Map<string, { wert: unknown; bis: number }>();

/** Datenalter fuer gemerkte Eintraege (Nutzerentscheid 2026-09-27: 300 s). */
export const MEMO_TTL_MS = 300_000;

export async function merke<T>(schluessel: string, ttlMs: number, lader: () => Promise<T>): Promise<T> {
  const jetzt = Date.now();
  const treffer = speicher.get(schluessel);
  if (treffer && treffer.bis > jetzt) return treffer.wert as T;
  const wert = await lader(); // Fehler werfen durch und werden nicht gemerkt
  speicher.delete(schluessel);
  speicher.set(schluessel, { wert, bis: jetzt + ttlMs });
  while (speicher.size > MAX_EINTRAEGE) speicher.delete(speicher.keys().next().value!);
  return wert;
}

export function vergiss(praefix: string): void {
  for (const schluessel of [...speicher.keys()]) if (schluessel.startsWith(praefix)) speicher.delete(schluessel);
}
