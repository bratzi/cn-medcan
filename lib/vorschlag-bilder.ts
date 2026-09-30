/**
 * Bilder zu einem Bluetenvorschlag (T10, Nutzer 2026-09-29). Der Browser hat sie
 * schon auf hoechstens 1280 px und 150 KB als WebP verkleinert; der Server
 * prueft jede Datei trotzdem erneut (Groesse vor dem Lesen, dann Typ, RIFF-Laenge
 * und Masse), denn der Client ist nicht vertrauenswuerdig. Gleiche Regeln wie
 * app/blueten/[slug]/budpic-aktionen.ts, nur ohne Sitzung und Datenbank.
 */
import { bildPruefen } from "@/lib/bild-pruefen";
import { BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE } from "@/lib/budpics";
import type { Meldung } from "@/lib/i18n/typen";
import type { PruefMeldung } from "@/lib/vorschlag-eingabe";

/** Bilder je Vorschlag; bei 5 offenen Vorschlaegen ergibt das hoechstens 15 Zeilen je Mitglied. */
export const VORSCHLAG_MAX_BILDER = 3;

export type GepruftesBild = { daten: Uint8Array<ArrayBuffer>; breite: number; hoehe: number };

/** Leere Dateifelder des Browsers (Name leer, Groesse 0) und Nicht-Dateien zaehlen nicht als Bild. */
export async function vorschlagBilderPruefen(roh: readonly unknown[]): Promise<PruefMeldung<GepruftesBild[]>> {
  const dateien = roh.filter((d): d is File => d instanceof File && d.size > 0);
  if (dateien.length > VORSCHLAG_MAX_BILDER) {
    return { ok: false, fehler: { schluessel: "vorschlag.zuVieleBilder", parameter: { max: VORSCHLAG_MAX_BILDER } } };
  }
  // Erst alle Groessen, dann erst einlesen: ein grosser Body soll keinen Speicher kosten.
  if (dateien.some((d) => d.size > BUDPIC_MAX_BYTES)) {
    return { ok: false, fehler: { schluessel: "bild.zuGross", parameter: { max: BUDPIC_MAX_BYTES / 1024 } } };
  }
  const bilder: GepruftesBild[] = [];
  for (const datei of dateien) {
    const daten = new Uint8Array(await datei.arrayBuffer());
    const e = bildPruefen(daten, { maxBytes: BUDPIC_MAX_BYTES, maxBreite: BUDPIC_MAX_KANTE, maxHoehe: BUDPIC_MAX_KANTE });
    if (!e.ok) return e;
    bilder.push({ daten, breite: e.breite, hoehe: e.hoehe });
  }
  return { ok: true, wert: bilder };
}

/** Bilder duerfen nur freigegebene Mitglieder beitragen (wie bei den Budpics); Vorschlaege ohne Bild bleiben fuer alle offen. */
export function bilderZugelassen(anzahl: number, freigegeben: boolean): Meldung | null {
  return anzahl > 0 && !freigegeben ? { schluessel: "budpic.nurFreigeschaltet" } : null;
}
