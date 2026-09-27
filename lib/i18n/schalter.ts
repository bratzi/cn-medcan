/**
 * Englisch ist erst oeffentlich, wenn alle fuenf Wellen uebersetzt sind
 * (Nutzerentscheid 2026-09-27). Bis dahin: kein Umschalter im Kopf, keine
 * Accept-Language-Erkennung; nur ein von Hand gesetztes Cookie (Test-Einstieg
 * /api/sprache?wahl=en) schaltet um. Task 11 setzt den Wert auf true.
 */
export const I18N_OEFFENTLICH = false;
