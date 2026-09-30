import { requireVar } from "@/lib/cloudflare";

/**
 * Angaben des Betreibers für Impressum und Datenschutzerklärung.
 *
 * VORLAGE, KEINE RECHTSBERATUNG: Impressum (§ 5 DDG, § 18 Abs. 2 MStV) und
 * Datenschutzerklärung (Art. 13 DSGVO) sind aus dem Code dieses Projekts
 * abgeleitet und müssen vor dem öffentlichen Start rechtlich geprüft werden.
 *
 * Das Repo ist öffentlich, deshalb stehen die Betreiberdaten NICHT hier.
 * Sie kommen zur Laufzeit aus dem Cloudflare-Secret `IMPRESSUM_JSON`
 * (Nutzer 2026-09-30), gesetzt mit `wrangler secret put IMPRESSUM_JSON`:
 * {"name","strasse","ort","land","email","telefon","bundesland"}, alles Strings.
 * Fehlt das Secret, ist es kein gültiges JSON oder fehlt ein Feld, steht die
 * betroffene Angabe als sichtbarer Platzhalter "[BITTE ERGÄNZEN: …]" auf der
 * Seite (kein Absturz), damit die Lücke auffällt.
 *
 * Betreiber ist eine Privatperson: Register, USt-IdNr. und Vertretung
 * entfallen fest (Nutzer 2026-09-30).
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
  /** Nur bei Gesellschaften; hier fest null (Privatperson). */
  vertretung: string | null;
  strasse: string;
  ort: string;
  land: string;
  email: string;
  /** Zweiter schneller Kontaktweg neben der E-Mail (§ 5 Abs. 1 Nr. 2 DDG). */
  telefon: string;
  /** Registergericht und Registernummer; hier fest null (Privatperson). */
  register: string | null;
  /** USt-IdNr. nach § 27a UStG; hier fest null (Privatperson). */
  ustId: string | null;
};

export type Aufsicht = {
  /** Offizieller Name der Landesbehörde oder ein Platzhalter. */
  name: string;
  /** Website der Behörde; null beim Platzhalter. */
  url: string | null;
};

export type Rechtliches = {
  betreiber: Betreiber;
  /** Verantwortlich für journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV) = Betreiber. */
  verantwortlich: { name: string; anschrift: string };
  aufsicht: Aufsicht;
};

/**
 * Landesdatenschutzbehörden für nicht-öffentliche Stellen. Bewusst nur Name und
 * Website, keine Postanschriften, damit nichts Falsches dasteht. Bayern: für
 * Unternehmen und Privatpersonen das BayLDA in Ansbach, nicht der BayLfD.
 */
export const AUFSICHTSBEHOERDEN: Record<string, Aufsicht> = {
  "Baden-Württemberg": {
    name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg",
    url: "https://www.baden-wuerttemberg.datenschutz.de",
  },
  Bayern: { name: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach", url: "https://www.lda.bayern.de" },
  Berlin: { name: "Berliner Beauftragte für Datenschutz und Informationsfreiheit", url: "https://www.datenschutz-berlin.de" },
  Brandenburg: {
    name: "Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg",
    url: "https://www.lda.brandenburg.de",
  },
  Bremen: {
    name: "Die Landesbeauftragte für Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen",
    url: "https://www.datenschutz.bremen.de",
  },
  Hamburg: { name: "Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit", url: "https://datenschutz-hamburg.de" },
  Hessen: { name: "Der Hessische Beauftragte für Datenschutz und Informationsfreiheit", url: "https://datenschutz.hessen.de" },
  "Mecklenburg-Vorpommern": {
    name: "Der Landesbeauftragte für Datenschutz und Informationsfreiheit Mecklenburg-Vorpommern",
    url: "https://www.datenschutz-mv.de",
  },
  Niedersachsen: { name: "Die Landesbeauftragte für den Datenschutz Niedersachsen", url: "https://lfd.niedersachsen.de" },
  "Nordrhein-Westfalen": {
    name: "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen",
    url: "https://www.ldi.nrw.de",
  },
  "Rheinland-Pfalz": {
    name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz",
    url: "https://www.datenschutz.rlp.de",
  },
  Saarland: { name: "Unabhängiges Datenschutzzentrum Saarland", url: "https://www.datenschutz.saarland.de" },
  Sachsen: { name: "Sächsische Datenschutz- und Transparenzbeauftragte", url: "https://www.saechsdsb.de" },
  "Sachsen-Anhalt": { name: "Landesbeauftragter für den Datenschutz Sachsen-Anhalt", url: "https://datenschutz.sachsen-anhalt.de" },
  "Schleswig-Holstein": {
    name: "Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein",
    url: "https://www.datenschutzzentrum.de",
  },
  Thüringen: {
    name: "Der Thüringer Landesbeauftragte für den Datenschutz und die Informationsfreiheit",
    url: "https://www.tlfdi.de",
  },
};

const AUFSICHT_PLATZHALTER: Aufsicht = {
  name: platzhalter("Bundesland im Secret IMPRESSUM_JSON (deutscher Name eines der 16 Länder)"),
  url: null,
};

/** Groß- und Kleinschreibung sowie Randleerzeichen egal. */
export function aufsichtFuer(bundesland: string | undefined): Aufsicht {
  const gesucht = bundesland?.trim().toLowerCase();
  if (!gesucht) return AUFSICHT_PLATZHALTER;
  const treffer = Object.entries(AUFSICHTSBEHOERDEN).find(([land]) => land.toLowerCase() === gesucht);
  return treffer ? treffer[1] : AUFSICHT_PLATZHALTER;
}

/**
 * Cloudflare, Inc. sitzt in den USA. Übermittlung auf Grundlage des EU-US Data
 * Privacy Framework, Auftragsverarbeitung über das Cloudflare DPA (Nutzer 2026-09-30).
 */
export const HOSTING_GRUNDLAGE =
  "Cloudflare, Inc. sitzt in den USA und ist nach dem EU-US Data Privacy Framework zertifiziert. Die Übermittlung dorthin beruht auf dem Angemessenheitsbeschluss der EU-Kommission vom 10. Juli 2023 (Art. 45 DSGVO). Mit Cloudflare besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO über das Cloudflare Data Processing Addendum.";

/** Stand der Datenschutzerklärung. */
export const DATENSCHUTZ_STAND = "30. September 2026";

/** Links auf die beiden Seiten, gemeinsam für Fuß und Zugangsseite. Texte unter fuss[schluessel]. */
export const RECHTLICHE_LINKS = [
  { href: "/impressum", schluessel: "impressum" },
  { href: "/datenschutz", schluessel: "datenschutz" },
] as const;

const FELDER = {
  name: "Vor- und Nachname oder Firma mit Rechtsform",
  strasse: "Straße und Hausnummer, kein Postfach",
  ort: "Postleitzahl und Ort",
  land: "Land",
  email: "E-Mail-Adresse",
  telefon: "Telefonnummer",
} as const;

type Feld = keyof typeof FELDER;

function alsObjekt(json: string | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    const roh: unknown = JSON.parse(json);
    return roh !== null && typeof roh === "object" && !Array.isArray(roh) ? (roh as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Reine Auswertung des Secret-Textes: nie werfen, fehlende Felder werden Platzhalter. */
export function parseRechtliches(json: string | undefined): Rechtliches {
  const roh = alsObjekt(json);
  const wert = (feld: Feld): string => {
    const v = roh[feld];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : platzhalter(FELDER[feld]);
  };
  const betreiber: Betreiber = {
    name: wert("name"),
    vertretung: null,
    strasse: wert("strasse"),
    ort: wert("ort"),
    land: wert("land"),
    email: wert("email"),
    telefon: wert("telefon"),
    register: null,
    ustId: null,
  };
  const bundesland = typeof roh.bundesland === "string" ? roh.bundesland : undefined;
  return {
    betreiber,
    verantwortlich: { name: betreiber.name, anschrift: `${betreiber.strasse}, ${betreiber.ort}, ${betreiber.land}` },
    aufsicht: aufsichtFuer(bundesland),
  };
}

/** Liest das Secret `IMPRESSUM_JSON` (Worker-Secret, lokal .dev.vars/.env.local). Wirft nie. */
export async function ladeRechtliches(): Promise<Rechtliches> {
  let json: string | undefined;
  try {
    json = await requireVar("IMPRESSUM_JSON");
  } catch {
    json = undefined;
  }
  return parseRechtliches(json);
}

/** Alle Angaben, die noch fehlen (für Tests und einen späteren Hinweis im Admin). */
export function offeneAngaben(r: Rechtliches): string[] {
  const werte = [...Object.values(r.betreiber), ...Object.values(r.verantwortlich), r.aufsicht.name];
  return werte.filter((wert): wert is string => istPlatzhalter(wert));
}
