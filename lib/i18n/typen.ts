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
