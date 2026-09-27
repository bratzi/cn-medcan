/**
 * Sprachwahl als reine Funktionen (Spec Englisch 4.1): ohne Request, ohne
 * Next, damit jede Regel fuer sich testbar ist. lib/i18n/sprache.ts liest
 * Cookie und Header und ruft nur bestimmeSprache().
 */
export const SPRACHEN = ["de", "en"] as const;
export type Sprache = (typeof SPRACHEN)[number];
export const SPRACH_COOKIE = "sprache";

export function istSprache(wert: unknown): wert is Sprache {
  return wert === "de" || wert === "en";
}

/**
 * Erster Eintrag mit de oder en nach Gewicht, bei Gleichstand die Reihenfolge.
 * Andere Sprachen zaehlen nicht mit; q=0 und kaputte Gewichte fallen raus.
 */
export function spracheAusAcceptLanguage(zeile: string | null): Sprache | null {
  if (!zeile) return null;
  const kandidaten = zeile
    .split(",")
    .map((teil, index) => {
      const [tag = "", ...optionen] = teil.trim().toLowerCase().split(";");
      const q = optionen.map((o) => o.trim()).find((o) => o.startsWith("q="));
      const gewicht = q === undefined ? 1 : Number(q.slice(2));
      return { basis: tag.trim().split("-")[0], gewicht: Number.isFinite(gewicht) ? gewicht : 0, index };
    })
    .filter((k) => k.gewicht > 0 && istSprache(k.basis))
    .sort((a, b) => b.gewicht - a.gewicht || a.index - b.index);
  const erster = kandidaten[0]?.basis;
  return istSprache(erster) ? erster : null;
}

export function bestimmeSprache(eingabe: {
  cookie: string | undefined;
  acceptLanguage: string | null;
  erkennungAktiv: boolean;
}): Sprache {
  if (istSprache(eingabe.cookie)) return eingabe.cookie;
  if (eingabe.erkennungAktiv) return spracheAusAcceptLanguage(eingabe.acceptLanguage) ?? "de";
  return "de";
}
