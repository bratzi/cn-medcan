/**
 * Alte Adressen, dauerhaft (308) umgeleitet, damit Lesezeichen und
 * Suchmaschinen-Treffer weiter funktionieren:
 * - /produkte hiess bis 2026-09 der Blueten-Katalog. Next reicht den
 *   Query-String selbst durch (/produkte?typ=INDICA -> /blueten?typ=INDICA).
 * - /bewerten/[slug] war bis 2026-09-29 die eigene Bewertungsseite; die Maske
 *   sitzt seitdem in der Bluetenseite am Anker #bewerten (Masterplan
 *   Bewertung v2, T4). Next erlaubt das Fragment im Ziel.
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
  { source: "/bewerten/:slug", destination: "/blueten/:slug#bewerten", permanent: true },
] as const satisfies ReadonlyArray<{ source: string; destination: string; permanent: boolean }>;
