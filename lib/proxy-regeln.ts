import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Regeln des Proxys als reine Funktionen (Spec 2026-10-01, statische Seiten,
 * 4.1), damit sie ohne Next testbar sind. proxy.ts setzt sie nur zusammen.
 * Ohne Next-Abhaengigkeit: NavLink nutzt ohneSprachPraefix im Browser.
 */

/**
 * Ohne Passwort erreichbar: die Login-Seite samt Route, Impressum und
 * Datenschutz (§ 5 DDG, Art. 13 DSGVO) und der Sprachwechsel, der auch auf
 * diesen Seiten funktionieren muss.
 * /ig: Landingpage aus der Instagram-Bio, muss ohne Passwort erreichbar sein (Spec 2026-10-15).
 */
const OHNE_GATE = ["/zugang", "/impressum", "/datenschutz", "/api/zugang", "/api/sprache", "/ig"] as const;

export function istOhneGate(pfad: string): boolean {
  return OHNE_GATE.some((frei) => pfad === frei || pfad.startsWith(`${frei}/`));
}

/**
 * Instagram-Feed und -Karten für Cowork (Nutzer 2026-10-14): bleiben hinter dem Gate, außer die
 * Anfrage trägt ?key=. Liefert den Schlüssel zum Prüfen gegen IG_FEED_KEY, sonst null.
 * Gilt nur für genau /api/ig-feed und /api/ig-karte/<id>, nie für Seiten oder andere Routen.
 */
export function igFeedSchluessel(pfad: string, suche: string): string | null {
  // Terpz-Jury (Task 9): Feed, Statusmeldung und die Jury-Fotos, die das Skript herunterlädt.
  const frei = pfad === "/api/ig-feed" || pfad === "/api/jury-feed" || pfad === "/api/jury-ig" || pfad === "/api/publora-sync" || /^\/api\/(ig-karte|bild)\/[^/]+$/.test(pfad);
  if (!frei || pfad === "/api/bild/offen") return null;
  return new URLSearchParams(suche).get("key") || null;
}

/** Route Handler: hinter dem Gate, aber ohne Sprach-Rewrite. */
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
