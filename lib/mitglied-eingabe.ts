/**
 * Pruefregeln fuer die Profilangaben eines Mitglieds.
 *
 * Bewusst ohne Request, Prisma und Sitzung: so ist die Regel fuer sich
 * pruefbar, statt nur ueber einen abgeschickten Server-Action-Aufruf. Die
 * Server Action (app/mitglied/aktionen.ts) ruft sie auf, bevor sie schreibt -
 * sie ist die einzige Stelle, an der ueber Gueltigkeit entschieden wird.
 */

export const ANZEIGENAME_MAXLAENGE = 60;
export const INSTAGRAM_MAXLAENGE = 30;

/** Instagram erlaubt Buchstaben, Ziffern, Punkt und Unterstrich. */
const INSTAGRAM_MUSTER = /^[A-Za-z0-9._]+$/;

export type ProfilEingabe = {
  anzeigename: string;
  /** Normalisiert: ohne fuehrendes @, leer wird zu null. */
  instagramHandle: string | null;
};

import type { Meldung } from "@/lib/i18n/typen";

export type PruefErgebnis =
  | { ok: true; wert: ProfilEingabe }
  | { ok: false; fehler: Meldung };

export function profilEingabePruefen(
  anzeigenameRoh: string,
  instagramRoh: string,
): PruefErgebnis {
  const anzeigename = anzeigenameRoh.trim();
  if (anzeigename.length === 0) {
    return { ok: false, fehler: { schluessel: "mitglied.nameFehlt" } };
  }
  if (anzeigename.length > ANZEIGENAME_MAXLAENGE) {
    return {
      ok: false,
      fehler: { schluessel: "mitglied.nameLang", parameter: { max: ANZEIGENAME_MAXLAENGE } },
    };
  }

  // Viele tippen den Namen mit @. Das gehoert nicht in die Spalte, sonst
  // stehen "@name" und "name" als zwei verschiedene Werte in der Datenbank.
  const handle = instagramRoh.trim().replace(/^@+/, "");
  if (handle.length > INSTAGRAM_MAXLAENGE || (handle.length > 0 && !INSTAGRAM_MUSTER.test(handle))) {
    return {
      ok: false,
      fehler: { schluessel: "mitglied.instagram", parameter: { max: INSTAGRAM_MAXLAENGE } },
    };
  }

  return {
    ok: true,
    wert: { anzeigename, instagramHandle: handle.length > 0 ? handle : null },
  };
}
