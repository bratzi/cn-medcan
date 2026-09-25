/**
 * Frische aller geteilten Daten (Spec Caching 2026-09-25, Nutzerentscheid:
 * bis 5 Minuten alt). Jede "use cache"-Einheit ruft cacheLife(FRIST) auf;
 * tests/cache-ohne-nutzerdaten.test.ts wacht darüber.
 */
export const FRIST = { stale: 60, revalidate: 300, expire: 3600 };

/** Tags für revalidateTag nach Admin-Aktionen. */
export const TAGS = {
  katalog: "katalog",
  bluete: (slug: string) => `bluete:${slug}`,
  reviews: "reviews",
  umfragen: "umfragen",
  apotheken: "apotheken",
} as const;
