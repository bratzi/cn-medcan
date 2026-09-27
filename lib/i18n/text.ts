import type { Sprache } from "./sprache-kern";
import type { Mehrzahl, Meldung, Woerterbuch } from "./typen";

type Parameter = Record<string, string | number>;

/** {name} durch parameter.name ersetzen; Unbekanntes bleibt sichtbar stehen. */
export function t(text: string, parameter: Parameter = {}): string {
  return text.replace(/\{(\w+)\}/g, (ganz, name: string) => (name in parameter ? String(parameter[name]) : ganz));
}

const REGELN: Record<Sprache, Intl.PluralRules> = {
  de: new Intl.PluralRules("de-DE"),
  en: new Intl.PluralRules("en-GB"),
};

export function mehrzahl(sprache: Sprache, eintrag: Mehrzahl, anzahl: number, parameter: Parameter = {}): string {
  const form = REGELN[sprache].select(anzahl) === "one" ? eintrag.one : eintrag.other;
  return t(form, { anzahl, ...parameter });
}

export function meldungText(w: Woerterbuch, meldung: Meldung): string {
  return t(w.meldung[meldung.schluessel], meldung.parameter);
}
