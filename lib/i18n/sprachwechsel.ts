import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Wohin der Sprachwechsel zurückführt (Spec 2026-10-01, statische Seiten, 4.1):
 * auf die Seite, von der er kam, laut Referer. Nur der eigene Origin zählt,
 * sonst die Startseite; sicheresZiel sperrt zusätzlich Pfade wie
 * "//fremd.example".
 */
export function zielNachSprachwechsel(referer: string | null, origin: string): string {
  if (!referer) return "/";
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return "/";
  }
  if (url.origin !== origin) return "/";
  return sicheresZiel(`${url.pathname}${url.search}`, "/");
}
