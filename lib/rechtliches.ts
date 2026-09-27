/**
 * Angaben des Betreibers für Impressum und Datenschutzerklärung.
 *
 * VORLAGE, KEINE RECHTSBERATUNG: Impressum (§ 5 DDG, § 18 Abs. 2 MStV) und
 * Datenschutzerklärung (Art. 13 DSGVO) sind aus dem Code dieses Projekts
 * abgeleitet und müssen vor dem öffentlichen Start rechtlich geprüft werden.
 *
 * Betreiberdaten werden hier NIE erfunden. Solange eine Angabe fehlt, steht
 * sie als sichtbarer Platzhalter "[BITTE ERGÄNZEN: …]" auf der Seite, damit
 * die Lücke auffällt statt als echte Angabe durchzugehen. Zum Ausfüllen den
 * Platzhalter durch den echten Wert ersetzen; Zeilen, die nicht zutreffen
 * (Register, USt-IdNr.), auf `null` setzen, dann entfallen sie.
 */

const PRAEFIX = "[BITTE ERGÄNZEN:";

export function platzhalter(was: string): string {
  return `${PRAEFIX} ${was}]`;
}

/** Wahr, solange eine Angabe noch der Platzhalter ist. */
export function istPlatzhalter(wert: string | null): boolean {
  return wert !== null && wert.startsWith(PRAEFIX);
}

export type Betreiber = {
  /** Name der natürlichen Person oder Firma mit Rechtsform. */
  name: string;
  /** Nur bei Gesellschaften: vertretungsberechtigte Person(en). */
  vertretung: string | null;
  strasse: string;
  ort: string;
  land: string;
  email: string;
  /** Zweiter schneller Kontaktweg neben der E-Mail (§ 5 Abs. 1 Nr. 2 DDG). */
  telefon: string;
  /** Registergericht und Registernummer, falls eingetragen. */
  register: string | null;
  /** USt-IdNr. nach § 27a UStG, falls vorhanden. */
  ustId: string | null;
};

export const BETREIBER: Betreiber = {
  name: platzhalter("Vor- und Nachname oder Firma mit Rechtsform"),
  vertretung: platzhalter("bei einer Gesellschaft die vertretungsberechtigte Person, sonst auf null setzen"),
  strasse: platzhalter("Straße und Hausnummer, kein Postfach"),
  ort: platzhalter("Postleitzahl und Ort"),
  land: platzhalter("Land"),
  email: platzhalter("E-Mail-Adresse"),
  telefon: platzhalter("Telefonnummer oder ein anderer schneller Kontaktweg"),
  register: platzhalter("Registergericht und Registernummer, sonst auf null setzen"),
  ustId: platzhalter("USt-IdNr. nach § 27a UStG, sonst auf null setzen"),
};

/** Verantwortlich für journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV). */
export const INHALTLICH_VERANTWORTLICH = {
  name: platzhalter("Vor- und Nachname der verantwortlichen Person"),
  anschrift: platzhalter("Anschrift der verantwortlichen Person"),
};

/** Zuständige Datenschutz-Aufsichtsbehörde (richtet sich nach dem Sitz des Betreibers). */
export const AUFSICHTSBEHOERDE = platzhalter("Name und Anschrift der Datenschutz-Aufsichtsbehörde des eigenen Bundeslandes");

/**
 * Cloudflare, Inc. sitzt in den USA. Aus dem Code nicht prüfbar, deshalb
 * Platzhalter: auf welcher Grundlage übermittelt wird und ob der
 * Auftragsverarbeitungsvertrag (Cloudflare DPA) gilt.
 */
export const HOSTING_GRUNDLAGE = platzhalter(
  "Grundlage der Übermittlung an Cloudflare in die USA prüfen (EU-US Data Privacy Framework oder Standardvertragsklauseln) und den Auftragsverarbeitungsvertrag nach Art. 28 DSGVO bestätigen",
);

/** Stand der Datenschutzerklärung. */
export const DATENSCHUTZ_STAND = platzhalter("Datum der Veröffentlichung");

/** Links auf die beiden Seiten, gemeinsam für Fuß und Zugangsseite. Texte unter fuss[schluessel]. */
export const RECHTLICHE_LINKS = [
  { href: "/impressum", schluessel: "impressum" },
  { href: "/datenschutz", schluessel: "datenschutz" },
] as const;

/** Alle Angaben, die noch fehlen (für Tests und einen späteren Hinweis im Admin). */
export function offeneAngaben(): string[] {
  const werte = [
    ...Object.values(BETREIBER),
    ...Object.values(INHALTLICH_VERANTWORTLICH),
    AUFSICHTSBEHOERDE,
    HOSTING_GRUNDLAGE,
    DATENSCHUTZ_STAND,
  ];
  return werte.filter((wert): wert is string => istPlatzhalter(wert));
}
