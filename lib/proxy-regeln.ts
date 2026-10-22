import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Regeln des Proxys als reine Funktionen (Spec 2026-10-01, statische Seiten,
 * 4.1), damit sie ohne Next testbar sind. proxy.ts setzt sie nur zusammen.
 * Ohne Next-Abhaengigkeit: NavLink nutzt ohneSprachPraefix im Browser.
 */

/** Route Handler: ohne Sprach-Rewrite. */
export function istApiPfad(pfad: string): boolean {
  return pfad === "/api" || pfad.startsWith("/api/");
}

/**
 * Der interne Pfad einer Seite: die Sprache als erstes Segment, das Root-Layout
 * liegt in app/[lang]/. "/" wird zu "/de", "/reviews" zu "/en/reviews". So legt
 * Next jede Seite je Sprache getrennt ab, ohne dass das Layout Cookies liest.
 */
export function internerPfad(sprache: Sprache, pfad: string): string {
  return pfad === "/" ? `/${sprache}` : `/${sprache}${pfad}`;
}

/**
 * Umkehrung von internerPfad. Der Server rendert unter dem internen Pfad
 * (/de/reviews), der Browser kennt den sichtbaren (/reviews).
 */
export function ohneSprachPraefix(pfad: string): string {
  const treffer = /^\/(de|en)(?:\/|$)/.exec(pfad);
  if (!treffer) return pfad;
  const rest = pfad.slice(treffer[1].length + 1);
  return rest === "" ? "/" : rest;
}
