/**
 * Pruefregeln rund um Umfragen.
 *
 * Wie lib/mitglied-eingabe.ts und lib/admin-eingabe.ts bewusst ohne Request,
 * Prisma und Sitzung: so ist jede Regel fuer sich pruefbar. Ueber
 * Berechtigung entscheidet weiterhin allein lib/session.ts.
 */

import { istUmfragePhase, type UmfragePhase } from "@/db/enums";

export const BEGRUENDUNG_MAXLAENGE = 500;
export const TITEL_MAXLAENGE = 120;
export const BESCHREIBUNG_MAXLAENGE = 1000;

export type UmfragePruefErgebnis<T> = { ok: true; wert: T } | { ok: false; fehler: string };

function idPruefen(roh: string): string | null {
  const id = roh.trim();
  return id.length > 0 ? id : null;
}

/**
 * Vorschlag eines Mitglieds.
 *
 * Die Begruendung ist freiwillig: wer eine Sorte nennt, muss sie nicht
 * verteidigen muessen. Leer wird zu null, damit nicht leere Zeichenketten und
 * NULL als zwei Zustaende nebeneinander in der Spalte stehen.
 */
export function vorschlagEingabePruefen(
  umfrageIdRoh: string,
  strainIdRoh: string,
  begruendungRoh: string,
): UmfragePruefErgebnis<{ umfrageId: string; strainId: string; begruendung: string | null }> {
  const umfrageId = idPruefen(umfrageIdRoh);
  if (!umfrageId) return { ok: false, fehler: "Keine Umfrage angegeben." };

  const strainId = idPruefen(strainIdRoh);
  if (!strainId) return { ok: false, fehler: "Bitte eine Sorte auswählen." };

  const begruendung = begruendungRoh.trim();
  if (begruendung.length > BEGRUENDUNG_MAXLAENGE) {
    return {
      ok: false,
      fehler: `Die Begründung darf höchstens ${BEGRUENDUNG_MAXLAENGE} Zeichen haben.`,
    };
  }

  return {
    ok: true,
    wert: { umfrageId, strainId, begruendung: begruendung.length > 0 ? begruendung : null },
  };
}

/** Stimmabgabe. Die fachlichen Bedingungen prueft die Schreibschicht. */
export function stimmeEingabePruefen(
  umfrageIdRoh: string,
  optionIdRoh: string,
): UmfragePruefErgebnis<{ umfrageId: string; optionId: string }> {
  const umfrageId = idPruefen(umfrageIdRoh);
  if (!umfrageId) return { ok: false, fehler: "Keine Umfrage angegeben." };

  const optionId = idPruefen(optionIdRoh);
  if (!optionId) return { ok: false, fehler: "Bitte einen Kandidaten auswählen." };

  return { ok: true, wert: { umfrageId, optionId } };
}

/**
 * Erlaubte Phasenwechsel.
 *
 * Nur vorwaerts: VORSCHLAG -> ABSTIMMUNG -> BEENDET. Ein Rueckschritt aus
 * ABSTIMMUNG wuerde bereits abgegebene Stimmen in einen Zustand stellen, in
 * dem sie fachlich nicht existieren duerften, und ein Wiederoeffnen einer
 * beendeten Runde wuerde ihr Ergebnis nachtraeglich verschiebbar machen.
 * Wer eine Runde wiederholen will, legt eine neue an.
 */
const NAECHSTE_PHASE: Record<UmfragePhase, UmfragePhase | null> = {
  VORSCHLAG: "ABSTIMMUNG",
  ABSTIMMUNG: "BEENDET",
  BEENDET: null,
};

export function phasenwechselPruefen(
  aktuellRoh: string,
  zielRoh: string,
): UmfragePruefErgebnis<{ ziel: UmfragePhase }> {
  if (!istUmfragePhase(aktuellRoh)) {
    return { ok: false, fehler: "Die Umfrage steht in einer unbekannten Phase." };
  }
  if (!istUmfragePhase(zielRoh)) {
    return { ok: false, fehler: "Unbekannte Phase." };
  }
  if (aktuellRoh === zielRoh) {
    return { ok: false, fehler: "Die Umfrage steht bereits in dieser Phase." };
  }
  if (NAECHSTE_PHASE[aktuellRoh] !== zielRoh) {
    return {
      ok: false,
      fehler: "Phasen laufen nur vorwärts: Vorschlag, Abstimmung, beendet.",
    };
  }
  return { ok: true, wert: { ziel: zielRoh } };
}

/** Titel und Beschreibung einer neuen Runde. */
export function umfrageEingabePruefen(
  titelRoh: string,
  beschreibungRoh: string,
  communityPlaetzeRoh: string,
): UmfragePruefErgebnis<{ titel: string; beschreibung: string | null; communityPlaetze: number }> {
  const titel = titelRoh.trim();
  if (titel.length === 0) return { ok: false, fehler: "Bitte einen Titel angeben." };
  if (titel.length > TITEL_MAXLAENGE) {
    return { ok: false, fehler: `Der Titel darf höchstens ${TITEL_MAXLAENGE} Zeichen haben.` };
  }

  const beschreibung = beschreibungRoh.trim();
  if (beschreibung.length > BESCHREIBUNG_MAXLAENGE) {
    return {
      ok: false,
      fehler: `Die Beschreibung darf höchstens ${BESCHREIBUNG_MAXLAENGE} Zeichen haben.`,
    };
  }

  // Number() statt parseInt(): "2x" soll ein Fehler sein, keine 2.
  const plaetze = Number(communityPlaetzeRoh.trim());
  if (!Number.isInteger(plaetze) || plaetze < 1 || plaetze > 10) {
    return { ok: false, fehler: "Community-Plätze: eine ganze Zahl von 1 bis 10." };
  }

  return {
    ok: true,
    wert: {
      titel,
      beschreibung: beschreibung.length > 0 ? beschreibung : null,
      communityPlaetze: plaetze,
    },
  };
}

/**
 * Wer gewinnt.
 *
 * Alle GESETZTEN Plaetze gewinnen immer - sie sind die Wahl des Betreibers
 * und standen nie zur Abstimmung. Dazu die `communityPlaetze`
 * stimmenstaerksten COMMUNITY-Optionen.
 *
 * Gleichstand am Schnitt: es entscheidet die fruehere Aufnahme in die Runde
 * (kleinere `reihenfolge`). Das ist eine gesetzte Regel, keine fachliche
 * Wahrheit - sie muss nur deterministisch und erklaerbar sein, sonst haengt
 * das Ergebnis an der Sortierung der Datenbank. Wer es anders will, greift
 * vor dem Beenden ein.
 */
export type OptionFuerAuswertung = {
  id: string;
  herkunft: string;
  reihenfolge: number;
  stimmen: number;
};

export function gewinnerErmitteln(
  optionen: readonly OptionFuerAuswertung[],
  communityPlaetze: number,
): string[] {
  const gesetzt = optionen.filter((o) => o.herkunft === "GESETZT").map((o) => o.id);

  const community = optionen
    .filter((o) => o.herkunft === "COMMUNITY")
    .slice()
    .sort((a, b) => b.stimmen - a.stimmen || a.reihenfolge - b.reihenfolge)
    .slice(0, communityPlaetze)
    // Eine Option ohne eine einzige Stimme hat niemand gewaehlt; sie ueber
    // einen freien Platz zum Gewinner zu erklaeren waere eine Behauptung.
    .filter((o) => o.stimmen > 0)
    .map((o) => o.id);

  return [...gesetzt, ...community];
}
