import { hwgTreffer } from "@/lib/hwg-filter";

export const MAX_KOMMENTAR = 1000;
export const MAX_MELDEGRUND = 200;

export function kommentarPruefen(roh: unknown): { ok: true; text: string } | { ok: false; fehler: "leer" | "lang" | "hwg" } {
  const text = typeof roh === "string" ? roh.trim() : "";
  if (!text) return { ok: false, fehler: "leer" };
  if (text.length > MAX_KOMMENTAR) return { ok: false, fehler: "lang" };
  if (hwgTreffer(text)) return { ok: false, fehler: "hwg" };
  return { ok: true, text };
}

export function meldegrundPruefen(roh: unknown): string | null {
  const t = typeof roh === "string" ? roh.trim() : "";
  return t ? t.slice(0, MAX_MELDEGRUND) : null;
}
