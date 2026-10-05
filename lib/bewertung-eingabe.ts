/**
 * Pruefung der Bewertungseingabe (Spec Redesign 17). Reine Funktion ohne
 * Datenbank: die Server Action liest das Formular hierueber und prueft
 * danach nur noch, was die Datenbank weiss (Sorte, Terpene, Rolle).
 */
import { z } from "zod";

import { gesamtnoteGueltig } from "@/lib/bewertung-v2";
import {
  BESCHAFFENHEIT_ACHSEN,
  BEWERTUNGS_ACHSEN,
  GESCHMACKS_ACHSEN,
  type Beschaffenheit,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";

export const MAX_NOTIZ = 1500;

export type BewertungEingabe = {
  strainId: string;
  chargenNr: string | null;
  /** 0,5-5 in halben Schritten, optional (Bewertung v2). */
  gesamtnote: number | null;
  noten: Record<(typeof BEWERTUNGS_ACHSEN)[number]["key"], number>;
  feuchtigkeitProzent: number | null;
  geschmacksMatrix: GeschmacksMatrix;
  terpenIntensitaet: Record<string, number>;
  beschaffenheit: Beschaffenheit;
  notiz: string | null;
  instagramReelUrl: string | null;
};

import type { Meldung } from "@/lib/i18n/typen";

export type Pruefung = { ok: true; wert: BewertungEingabe } | { ok: false; fehler: Meldung };

type Lesbar = { get(name: string): unknown };

const text = (roh: unknown) => (typeof roh === "string" ? roh.trim() : "");

const note = z.coerce.number().int().min(1).max(5);
const achse = z.coerce.number().min(0).max(5).multipleOf(0.5);
/**
 * Terpene sind seit 2026-10-03 an oder aus (Nutzer: die Staerkeregler waren zu komplex).
 * Gespeichert werden 0 und 1. Aeltere Formulare und Bewertungen tragen Stufen bis 5; jede
 * Stufe ueber 0 bedeutet "an" und wird deshalb auf 1 gelesen.
 */
const intensitaet = z.coerce.number().int().min(0).max(5).transform((wert) => (wert > 0 ? 1 : 0));

/** Reel nur als oeffentliche Instagram-URL. */
const REEL = /^https:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

/**
 * Liest ein Formular. Erwartete Felder: strainId, chargenNr, note-<achse>
 * (1-5), feuchtigkeit (Prozent, optional), geschmack-<achse> (0-5 in
 * halben Schritten), terpen-<Name> (0 oder 1, 0 = nicht geschmeckt, nur fuer uebergebene Terpene),
 * notiz, instagramReelUrl.
 */
export function bewertungPruefen(formular: Lesbar, terpenNamen: readonly string[]): Pruefung {
  const strainId = text(formular.get("strainId"));
  if (!strainId) return { ok: false, fehler: { schluessel: "bewertung.sorteFehlt" } };

  const chargenNr = text(formular.get("chargenNr")) || null;
  if (chargenNr && !/^[A-Za-z0-9./ -]{1,40}$/.test(chargenNr)) {
    return { ok: false, fehler: { schluessel: "bewertung.chargeZeichen" } };
  }

  const noten = {} as BewertungEingabe["noten"];
  for (const { key } of BEWERTUNGS_ACHSEN) {
    const wert = note.safeParse(formular.get(`note-${key}`));
    if (!wert.success) return { ok: false, fehler: { schluessel: "bewertung.note", parameter: { feld: key } } };
    noten[key] = wert.data;
  }

  const gesamtRoh = text(formular.get("gesamtnote")).replace(",", ".");
  const gesamtnote = gesamtRoh ? Number(gesamtRoh) : null;
  if (gesamtnote !== null && !gesamtnoteGueltig(gesamtnote)) return { ok: false, fehler: { schluessel: "bewertung.gesamtnote" } };

  const feuchtRoh = text(formular.get("feuchtigkeit")).replace(",", ".");
  let feuchtigkeitProzent: number | null = null;
  if (feuchtRoh) {
    const wert = Number(feuchtRoh);
    if (!Number.isFinite(wert) || wert < 0 || wert > 30) {
      return { ok: false, fehler: { schluessel: "bewertung.feuchte" } };
    }
    feuchtigkeitProzent = Math.round(wert * 10) / 10;
  }

  const geschmacksMatrix = {} as GeschmacksMatrix;
  for (const { key, enumWert } of GESCHMACKS_ACHSEN) {
    const wert = achse.safeParse(formular.get(`geschmack-${key}`) ?? 0);
    if (!wert.success) return { ok: false, fehler: { schluessel: "bewertung.halbeSchritte", parameter: { geschmack: enumWert } } };
    geschmacksMatrix[key] = wert.data;
  }

  const terpenIntensitaet: Record<string, number> = {};
  for (const name of terpenNamen) {
    const roh = formular.get(`terpen-${name}`);
    if (roh === null || roh === undefined || roh === "") continue;
    const wert = intensitaet.safeParse(roh);
    if (!wert.success) return { ok: false, fehler: { schluessel: "bewertung.intensitaet", parameter: { terpen: name } } };
    terpenIntensitaet[name] = wert.data;
  }

  const beschaffenheit: Beschaffenheit = {};
  for (const { key } of BESCHAFFENHEIT_ACHSEN) {
    const roh = formular.get(`beschaffenheit-${key}`);
    if (roh === null || roh === undefined || roh === "") continue;
    const wert = achse.safeParse(roh);
    if (!wert.success) return { ok: false, fehler: { schluessel: "bewertung.halbeSchritte", parameter: { beschaffenheit: key } } };
    beschaffenheit[key] = wert.data;
  }

  const notiz = text(formular.get("notiz")) || null;
  if (notiz && notiz.length > MAX_NOTIZ) return { ok: false, fehler: { schluessel: "bewertung.notizLang", parameter: { max: MAX_NOTIZ } } };

  const instagramReelUrl = text(formular.get("instagramReelUrl")) || null;
  if (instagramReelUrl && !REEL.test(instagramReelUrl)) {
    return { ok: false, fehler: { schluessel: "bewertung.reelUrl" } };
  }

  return {
    ok: true,
    wert: { strainId, chargenNr, gesamtnote, noten, feuchtigkeitProzent, geschmacksMatrix, terpenIntensitaet, beschaffenheit, notiz, instagramReelUrl },
  };
}
