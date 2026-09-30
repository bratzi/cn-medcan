/**
 * Alte Adressen, dauerhaft (308) umgeleitet, damit Lesezeichen und
 * Suchmaschinen-Treffer weiter funktionieren:
 * - /produkte hiess bis 2026-09 der Blueten-Katalog. Next reicht den
 *   Query-String selbst durch (/produkte?typ=INDICA -> /blueten?typ=INDICA).
 * - /bewerten/[slug] war bis 2026-09-29 die eigene Bewertungsseite; die Maske
 *   sitzt seitdem in der Bluetenseite am Anker #bewerten (Masterplan
 *   Bewertung v2, T4). Steht NICHT in der Config-Liste: OpenNext haengt die
 *   Query an den fertigen Zielstring, aus /bewerten/x?a=1 wurde
 *   /blueten/x#bewerten?a=1 und der Anker griff nicht (T19). Die Weiterleitung
 *   baut stattdessen proxy.ts mit bewertenWeiterleitung().
 *
 * Redirects aus next.config laufen vor dem Proxy (proxy.ts); das
 * Passwort-Gate greift also erst auf der neuen Adresse.
 *
 * Eigene Datei statt direkt in next.config.ts, damit der Test sie ohne die
 * Seiteneffekte der Config (initOpenNextCloudflareForDev) laden kann.
 */
export const ALTE_KATALOG_WEITERLEITUNGEN = [
  { source: "/produkte", destination: "/blueten", permanent: true },
  { source: "/produkte/:slug", destination: "/blueten/:slug", permanent: true },
] as const satisfies ReadonlyArray<{ source: string; destination: string; permanent: boolean }>;

/** Ziel fuer /bewerten/:slug mit Query vor dem Fragment; null bei anderen Pfaden. */
export function bewertenWeiterleitung(pfad: string, suche: string): string | null {
  const treffer = /^\/bewerten\/([^/]+)$/.exec(pfad);
  if (!treffer) return null;
  return `/blueten/${treffer[1]}${suche}#bewerten`;
}
