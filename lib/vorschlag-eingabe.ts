/**
 * Pruefung und reine Logik fuer "Bluete vorschlagen" (Spec 2026-09-25).
 * Ohne Datenbank, Request und Sitzung, damit direkt testbar. Ueber Rechte
 * entscheidet lib/session.ts, hier nur ueber Gueltigkeit.
 */
import { z } from "zod";

import {
  BESTRAHLUNGEN,
  KULTIVAR_TYPEN,
  type Bestrahlung,
  type KultivarTyp,
} from "@/db/enums";
import { slugAusName } from "@/lib/stamm-id";

export const MAX_OFFENE_VORSCHLAEGE = 5;
export const MAX_VORSCHLAG_NOTIZ = 500;
export const MAX_VORSCHLAG_TERPENE = 3;
export const MAX_FREIGABE_TERPENE = 5;
const MAX_NAME = 120;
const MAX_QUELLE = 300;

export type Pruef<T> = { ok: true; wert: T } | { ok: false; fehler: string };

type Lesbar = { get(name: string): unknown };

const text = (roh: unknown) => (typeof roh === "string" ? roh.trim() : "");
const optional = (roh: unknown) => text(roh) || null;

function zahl(roh: unknown, max: number): number | null | "fehler" {
  const t = text(roh).replace(",", ".");
  if (!t) return null;
  const e = z.coerce.number().min(0).max(max).safeParse(t);
  return e.success ? e.data : "fehler";
}

function terpeneAusFormular(
  formular: Lesbar,
  anzahl: number,
  erlaubt: readonly string[],
): string[] | "fehler" {
  const liste: string[] = [];
  for (let i = 1; i <= anzahl; i++) {
    const name = text(formular.get(`terpen${i}`));
    if (!name) continue;
    if (!erlaubt.includes(name)) return "fehler";
    if (!liste.includes(name)) liste.push(name);
  }
  return liste;
}

function istKultivarTyp(wert: string): wert is KultivarTyp {
  return (KULTIVAR_TYPEN as readonly string[]).includes(wert);
}

function istBestrahlung(wert: string): wert is Bestrahlung {
  return (BESTRAHLUNGEN as readonly string[]).includes(wert);
}

export type BlueteVorschlag = {
  handelsname: string;
  schluessel: string;
  hersteller: string | null;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp | null;
  thcProzent: number | null;
  cbdProzent: number | null;
  terpene: string[];
  quelle: string;
  notiz: string | null;
};

function nameUndSchluessel(formular: Lesbar, feld: string): Pruef<{ name: string; slug: string }> {
  const name = text(formular.get(feld));
  if (!name) return { ok: false, fehler: "Der Handelsname fehlt." };
  if (name.length > MAX_NAME) return { ok: false, fehler: `Der Handelsname ist länger als ${MAX_NAME} Zeichen.` };
  const slug = slugAusName(name);
  if (!slug) return { ok: false, fehler: "Der Handelsname braucht Buchstaben oder Ziffern." };
  return { ok: true, wert: { name, slug } };
}

export function blueteVorschlagPruefen(
  formular: Lesbar,
  terpenNamen: readonly string[],
): Pruef<BlueteVorschlag> {
  const name = nameUndSchluessel(formular, "handelsname");
  if (!name.ok) return name;

  const quelle = text(formular.get("quelle"));
  if (!quelle) return { ok: false, fehler: "Bitte gib an, woher du die Angaben hast." };
  if (quelle.length > MAX_QUELLE) return { ok: false, fehler: `Die Quelle ist länger als ${MAX_QUELLE} Zeichen.` };

  const typRoh = text(formular.get("kultivarTyp"));
  if (typRoh && !istKultivarTyp(typRoh)) return { ok: false, fehler: "Unbekannter Kultivartyp." };

  const thc = zahl(formular.get("thc"), 40);
  if (thc === "fehler") return { ok: false, fehler: "THC bitte als Zahl zwischen 0 und 40 %." };
  const cbd = zahl(formular.get("cbd"), 30);
  if (cbd === "fehler") return { ok: false, fehler: "CBD bitte als Zahl zwischen 0 und 30 %." };

  const terpene = terpeneAusFormular(formular, MAX_VORSCHLAG_TERPENE, terpenNamen);
  if (terpene === "fehler") return { ok: false, fehler: "Bitte nur Terpene aus der Liste wählen." };

  const notiz = optional(formular.get("notiz"));
  if (notiz && notiz.length > MAX_VORSCHLAG_NOTIZ) {
    return { ok: false, fehler: `Die Notiz ist länger als ${MAX_VORSCHLAG_NOTIZ} Zeichen.` };
  }

  return {
    ok: true,
    wert: {
      handelsname: name.wert.name,
      schluessel: name.wert.slug,
      hersteller: optional(formular.get("hersteller")),
      kultivarName: optional(formular.get("kultivarName")),
      kultivarTyp: typRoh && istKultivarTyp(typRoh) ? typRoh : null,
      thcProzent: thc,
      cbdProzent: cbd,
      terpene,
      quelle,
      notiz,
    },
  };
}

export type BlueteFreigabe = {
  vorschlagSchluessel: string;
  handelsname: string;
  slug: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  hersteller: string | null;
  terpene: string[];
  bestrahlung: Bestrahlung;
  anbauland: string | null;
};

function spanne(formular: Lesbar, name: "THC" | "CBD", von: string, bis: string): Pruef<[number, number]> {
  const min = zahl(formular.get(von), 100);
  const max = zahl(formular.get(bis), 100);
  if (min === "fehler" || max === "fehler" || min === null || max === null) {
    return { ok: false, fehler: `${name}: bitte beide Werte zwischen 0 und 100 % angeben.` };
  }
  if (min > max) return { ok: false, fehler: `${name}: der kleinste Wert ist größer als der größte.` };
  return { ok: true, wert: [min, max] };
}

export function blueteFreigabePruefen(
  formular: Lesbar,
  terpenNamen: readonly string[],
): Pruef<BlueteFreigabe> {
  const vorschlagSchluessel = text(formular.get("vorschlagSchluessel"));
  if (!vorschlagSchluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };

  const name = nameUndSchluessel(formular, "handelsname");
  if (!name.ok) return name;

  const typ = text(formular.get("kultivarTyp"));
  if (!istKultivarTyp(typ)) return { ok: false, fehler: "Bitte den Kultivartyp wählen." };

  const thc = spanne(formular, "THC", "thcMin", "thcMax");
  if (!thc.ok) return thc;
  const cbd = spanne(formular, "CBD", "cbdMin", "cbdMax");
  if (!cbd.ok) return cbd;

  const terpene = terpeneAusFormular(formular, MAX_FREIGABE_TERPENE, terpenNamen);
  if (terpene === "fehler") return { ok: false, fehler: "Bitte nur Terpene aus der Liste wählen." };

  const bestrahlungRoh = text(formular.get("bestrahlung")) || "UNBEKANNT";
  if (!istBestrahlung(bestrahlungRoh)) return { ok: false, fehler: "Unbekannte Bestrahlung." };

  return {
    ok: true,
    wert: {
      vorschlagSchluessel,
      handelsname: name.wert.name,
      slug: name.wert.slug,
      kultivarName: optional(formular.get("kultivarName")),
      kultivarTyp: typ,
      thcMin: thc.wert[0],
      thcMax: thc.wert[1],
      cbdMin: cbd.wert[0],
      cbdMax: cbd.wert[1],
      hersteller: optional(formular.get("hersteller")),
      terpene,
      bestrahlung: bestrahlungRoh,
      anbauland: optional(formular.get("anbauland")),
    },
  };
}

export type OffenerVorschlag = {
  id: string;
  mitgliedId: string;
  anzeigename: string;
  handelsname: string;
  schluessel: string;
  hersteller: string | null;
  kultivarName: string | null;
  kultivarTyp: string | null;
  thcProzent: number | null;
  cbdProzent: number | null;
  terpene: string[];
  quelle: string;
  notiz: string | null;
  erstelltAm: Date;
};

export type VorschlagGruppe = { schluessel: string; vorschlaege: OffenerVorschlag[] };

/** Gleiche Schluessel zusammen, in der Gruppe nach Alter, aelteste Gruppe zuerst. */
export function vorschlaegeBuendeln(liste: readonly OffenerVorschlag[]): VorschlagGruppe[] {
  const gruppen = new Map<string, OffenerVorschlag[]>();
  for (const v of [...liste].sort((a, b) => a.erstelltAm.getTime() - b.erstelltAm.getTime())) {
    const gruppe = gruppen.get(v.schluessel);
    if (gruppe) gruppe.push(v);
    else gruppen.set(v.schluessel, [v]);
  }
  return [...gruppen].map(([schluessel, vorschlaege]) => ({ schluessel, vorschlaege }));
}

export type FreigabeVorbelegung = {
  handelsname: string;
  kultivarName: string;
  kultivarTyp: string;
  thcMin: string;
  thcMax: string;
  cbdMin: string;
  cbdMax: string;
  hersteller: string;
  terpene: string[];
};

function erster<T>(liste: readonly OffenerVorschlag[], feld: (v: OffenerVorschlag) => T | null): T | null {
  for (const v of liste) {
    const wert = feld(v);
    if (wert !== null && wert !== undefined) return wert;
  }
  return null;
}

/** Formularwerte fuer die Freigabe: erster Vorschlag zuerst, Luecken aus den weiteren. */
export function freigabeVorbelegen(gruppe: VorschlagGruppe): FreigabeVorbelegung {
  const l = gruppe.vorschlaege;
  const thc = erster(l, (v) => v.thcProzent);
  const cbd = erster(l, (v) => v.cbdProzent);
  const terpene = erster(l, (v) => (v.terpene.length ? v.terpene : null));
  return {
    handelsname: l[0]?.handelsname ?? "",
    kultivarName: erster(l, (v) => v.kultivarName) ?? "",
    kultivarTyp: erster(l, (v) => v.kultivarTyp) ?? "",
    thcMin: thc === null ? "" : String(thc),
    thcMax: thc === null ? "" : String(thc),
    cbdMin: cbd === null ? "" : String(cbd),
    cbdMax: cbd === null ? "" : String(cbd),
    hersteller: erster(l, (v) => v.hersteller) ?? "",
    terpene: terpene ?? [],
  };
}

/**
 * Steht unter diesem Namen schon eine andere Bluete? Gleiche Id ist kein
 * Konflikt (Doppelklick oder Import dazwischen): dann wird sie genommen.
 */
export function freigabeKonflikt(
  sollId: string,
  vorhanden: { id: string; slug: string } | null,
): { slug: string } | null {
  if (!vorhanden || vorhanden.id === sollId) return null;
  return { slug: vorhanden.slug };
}

/** Nur http(s) wird verlinkt; alles andere bleibt Text. */
export function quelleAlsLink(quelle: string): string | null {
  try {
    const url = new URL(quelle.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Liest die Terpenspalte. Nie ungeprueft JSON.parse in einer Komponente. */
export function terpeneLesen(json: string | null): string[] {
  if (!json) return [];
  try {
    const roh: unknown = JSON.parse(json);
    return Array.isArray(roh) ? roh.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Terpene der Freigabe schreiben? Ja, wenn die Bluete gerade angelegt wurde,
 * oder wenn sie mit genau dieser Id schon steht, aber noch keine Terpene hat
 * (ein erster Klick brach nach dem Anlegen ab). Eine Import-Bluete mit eigenen
 * Terpenen bleibt unangetastet (Review 2026-09-25, Important 1).
 */
export function terpeneNachtragen(lage: {
  gewaehlt: number;
  neuAngelegt: boolean;
  gleicheId: boolean;
  vorhandeneTerpene: number;
}): boolean {
  if (lage.gewaehlt === 0) return false;
  return lage.neuAngelegt || (lage.gleicheId && lage.vorhandeneTerpene === 0);
}
