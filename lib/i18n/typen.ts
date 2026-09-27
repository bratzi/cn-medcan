import type { de } from "./de";

/** Mehrzahl nach Intl.PluralRules; {anzahl} setzt mehrzahl() selbst. */
export type Mehrzahl = { readonly one: string; readonly other: string };

type Breit<T> = T extends string
  ? string
  : T extends Mehrzahl
    ? Mehrzahl
    : { readonly [K in keyof T]: Breit<T[K]> };

/** Form des deutschen Woerterbuchs mit beliebigen Texten: en muss genau so aussehen. */
export type Woerterbuch = Breit<typeof de>;

export type MeldungSchluessel = keyof Woerterbuch["meldung"];
export type Meldung = { schluessel: MeldungSchluessel; parameter?: Record<string, string | number> };

/**
 * Alles, was die Aroma-Bausteine im Browser brauchen (Karte, Erkundung,
 * Sweet Spot, Leisten): nur diese Ausschnitte, nicht das ganze Woerterbuch.
 */
export type AromaTexte = {
  aroma: Woerterbuch["aroma"];
  schema: Woerterbuch["schema"];
  geschmack: Woerterbuch["label"]["geschmack"];
  sprache: import("./sprache-kern").Sprache;
};

export function aromaTexte(w: Woerterbuch, sprache: import("./sprache-kern").Sprache): AromaTexte {
  return { aroma: w.aroma, schema: w.schema, geschmack: w.label.geschmack, sprache };
}
