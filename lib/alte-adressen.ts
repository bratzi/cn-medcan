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

/** /mitglied war bis 2026-10-13 die Konto-Seite; seitdem steht alles auf /profil (Spec Profil und Konto vereint 3.3). */
export const ALTE_KONTO_WEITERLEITUNGEN = [
  { source: "/mitglied", destination: "/profil", permanent: true },
] as const satisfies ReadonlyArray<{ source: string; destination: string; permanent: boolean }>;

/** Ziel fuer /bewerten/:slug mit Query vor dem Fragment; null bei anderen Pfaden. */
export function bewertenWeiterleitung(pfad: string, suche: string): string | null {
  const treffer = /^\/bewerten\/([^/]+)$/.exec(pfad);
  if (!treffer) return null;
  return `/blueten/${treffer[1]}${suche}#bewerten`;
}

/**
 * Ziel fuer eine alte Produktadresse /blueten/<produkt-slug> (Spec Sorte im
 * Fokus, 2): die Sortenseite mit ?ware=<produkt-slug>, vorhandene Query
 * dahinter. null, wenn der Pfad keine Bluetenseite ist, der Slug kein Produkt
 * kennt oder schon der Sorten-Slug ist (keine Schleife).
 */
export function sortenWeiterleitung(
  pfad: string,
  suche: string,
  kultivarSlugVon: (produktSlug: string) => string | null,
): string | null {
  const treffer = /^\/blueten\/([^/]+)$/.exec(pfad);
  if (!treffer) return null;
  const produktSlug = treffer[1];
  const kultivarSlug = kultivarSlugVon(produktSlug);
  if (!kultivarSlug || kultivarSlug === produktSlug) return null;
  const rest = suche.startsWith("?") ? suche.slice(1) : suche;
  return `${bluetenHref(produktSlug, kultivarSlug)}${rest ? `&${rest}` : ""}`;
}

/**
 * Direkter Link auf eine Bluete ohne 308-Umweg: mit Sorten-Slug die
 * Sortenseite mit ?ware=<produkt-slug>, sonst die Produktadresse.
 */
export function bluetenHref(produktSlug: string, kultivarSlug: string | null | undefined): string {
  if (!kultivarSlug || kultivarSlug === produktSlug) return `/blueten/${produktSlug}`;
  return `/blueten/${kultivarSlug}?ware=${encodeURIComponent(produktSlug)}`;
}

/**
 * Direkter Link auf eine Bewertung ohne 308-Umweg: mit Sorten-Slug die Sortenseite,
 * auf den Vertreiber gefiltert, sonst die Produktadresse.
 */
export function bewertungHref(
  ziel: { strainSlug: string; kultivarSlug: string | null | undefined; vertreiberId: string | null | undefined },
  id: string,
): string {
  if (!ziel.kultivarSlug) return `/blueten/${ziel.strainSlug}#bewertung-${id}`;
  const frage = ziel.vertreiberId ? `?vertreiber=${encodeURIComponent(ziel.vertreiberId)}` : "";
  return `/blueten/${ziel.kultivarSlug}${frage}#bewertung-${id}`;
}

/** Zusammengelegte Sorten-Dubletten: alter Sorten-Slug -> behaltener (Migration 0025). */
export const ABGELOESTE_SORTEN: Readonly<Record<string, string>> = {
  "8-ball-kush-2": "8-ball-kush",
};

/** Ziel fuer /blueten/<abgeloester-sorten-slug>, Query bleibt; sonst null. */
export function abgeloesteSorteWeiterleitung(pfad: string, suche: string): string | null {
  const treffer = /^\/blueten\/([^/]+)$/.exec(pfad);
  if (!treffer) return null;
  const alt = decodeURIComponent(treffer[1]);
  const ziel = Object.hasOwn(ABGELOESTE_SORTEN, alt) ? ABGELOESTE_SORTEN[alt] : null;
  return ziel ? `/blueten/${ziel}${suche}` : null;
}
