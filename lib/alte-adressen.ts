/**
 * Alte Katalog-Adressen: /produkte hiess bis 2026-09 der Blueten-Katalog.
 * Dauerhaft (308) auf /blueten, damit Lesezeichen und Suchmaschinen-Treffer
 * weiter funktionieren. Next reicht den Query-String selbst durch
 * (/produkte?typ=INDICA -> /blueten?typ=INDICA).
 *
 * Redirects aus next.config laufen vor dem Proxy (proxy.ts); das
 * Passwort-Gate greift also erst auf der neuen Adresse /blueten.
 *
 * Eigene Datei statt direkt in next.config.ts, damit der Test sie ohne die
 * Seiteneffekte der Config (initOpenNextCloudflareForDev) laden kann.
 */
export const ALTE_KATALOG_WEITERLEITUNGEN = [
  { source: "/produkte", destination: "/blueten", permanent: true },
  { source: "/produkte/:slug", destination: "/blueten/:slug", permanent: true },
] as const satisfies ReadonlyArray<{ source: string; destination: string; permanent: boolean }>;
