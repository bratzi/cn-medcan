/**
 * Pruefung der Bewertungseingabe (Spec Redesign 17). Reine Funktion ohne
 * Datenbank: die Server Action liest das Formular hierueber und prueft
 * danach nur noch, was die Datenbank weiss (Sorte, Terpene, Rolle).
 */
import { z } from "zod";

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
  noten: Record<(typeof BEWERTUNGS_ACHSEN)[number]["key"], number>;
  feuchtigkeitProzent: number | null;
  geschmacksMatrix: GeschmacksMatrix;
  terpenIntensitaet: Record<string, number>;
  beschaffenheit: Beschaffenheit;
  notiz: string | null;
  instagramReelUrl: string | null;
};

export type Pruefung = { ok: true; wert: BewertungEingabe } | { ok: false; fehler: string };

type Lesbar = { get(name: string): unknown };

const text = (roh: unknown) => (typeof roh === "string" ? roh.trim() : "");

const note = z.coerce.number().int().min(1).max(5);
const achse = z.coerce.number().min(0).max(5).multipleOf(0.5);
const intensitaet = z.coerce.number().int().min(0).max(5);

/** Reel nur als oeffentliche Instagram-URL. */
const REEL = /^https:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

/**
 * Liest ein Formular. Erwartete Felder: strainId, chargenNr, note-<achse>
 * (1-5), feuchtigkeit (Prozent, optional), geschmack-<achse> (0-5 in
 * halben Schritten), terpen-<Name> (0-5, 0 = nicht geschmeckt, nur fuer uebergebene Terpene),
 * notiz, instagramReelUrl.
 */
export function bewertungPruefen(formular: Lesbar, terpenNamen: readonly string[]): Pruefung {
  const strainId = text(formular.get("strainId"));
  if (!strainId) return { ok: false, fehler: "Die Sorte fehlt." };

  const chargenNr = text(formular.get("chargenNr")) || null;
  if (chargenNr && !/^[A-Za-z0-9./ -]{1,40}$/.test(chargenNr)) {
    return { ok: false, fehler: "Die Chargennummer enthält unerlaubte Zeichen." };
  }

  const noten = {} as BewertungEingabe["noten"];
  for (const { key, label } of BEWERTUNGS_ACHSEN) {
    const wert = note.safeParse(formular.get(`note-${key}`));
    if (!wert.success) return { ok: false, fehler: `${label}: bitte eine Note von 1 bis 5 wählen.` };
    noten[key] = wert.data;
  }

  const feuchtRoh = text(formular.get("feuchtigkeit")).replace(",", ".");
  let feuchtigkeitProzent: number | null = null;
  if (feuchtRoh) {
    const wert = Number(feuchtRoh);
    if (!Number.isFinite(wert) || wert < 0 || wert > 30) {
      return { ok: false, fehler: "Restfeuchte bitte als Prozent zwischen 0 und 30 angeben." };
    }
    feuchtigkeitProzent = Math.round(wert * 10) / 10;
  }

  const geschmacksMatrix = {} as GeschmacksMatrix;
  for (const { key, label } of GESCHMACKS_ACHSEN) {
    const wert = achse.safeParse(formular.get(`geschmack-${key}`) ?? 0);
    if (!wert.success) return { ok: false, fehler: `${label}: Wert von 0 bis 5 in halben Schritten.` };
    geschmacksMatrix[key] = wert.data;
  }

  const terpenIntensitaet: Record<string, number> = {};
  for (const name of terpenNamen) {
    const roh = formular.get(`terpen-${name}`);
    if (roh === null || roh === undefined || roh === "") continue;
    const wert = intensitaet.safeParse(roh);
    if (!wert.success) return { ok: false, fehler: `${name}: Intensität von 0 bis 5 wählen.` };
    terpenIntensitaet[name] = wert.data;
  }

  const beschaffenheit: Beschaffenheit = {};
  for (const { key, label } of BESCHAFFENHEIT_ACHSEN) {
    const roh = formular.get(`beschaffenheit-${key}`);
    if (roh === null || roh === undefined || roh === "") continue;
    const wert = achse.safeParse(roh);
    if (!wert.success) return { ok: false, fehler: `${label}: Wert von 0 bis 5 in halben Schritten.` };
    beschaffenheit[key] = wert.data;
  }

  const notiz = text(formular.get("notiz")) || null;
  if (notiz && notiz.length > MAX_NOTIZ) return { ok: false, fehler: `Die Notiz darf höchstens ${MAX_NOTIZ} Zeichen haben.` };

  const instagramReelUrl = text(formular.get("instagramReelUrl")) || null;
  if (instagramReelUrl && !REEL.test(instagramReelUrl)) {
    return { ok: false, fehler: "Bitte eine öffentliche Instagram-URL (Reel oder Beitrag) angeben." };
  }

  return {
    ok: true,
    wert: { strainId, chargenNr, noten, feuchtigkeitProzent, geschmacksMatrix, terpenIntensitaet, beschaffenheit, notiz, instagramReelUrl },
  };
}
