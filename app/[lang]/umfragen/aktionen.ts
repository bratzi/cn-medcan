"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { freigabeErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { nimmtVorschlaegeAn, stimmeEingabePruefen, vorschlagEingabePruefen } from "@/lib/umfrage-eingabe";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";

export type UmfrageErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Schreibaktionen der Mitglieder.
 *
 * Beide beginnen mit `freigabeErforderlich()`: Vorschlagen und Abstimmen
 * setzen die manuelle Freigabe des Betreibers voraus - das ist die
 * Verifizierung dieses Projekts. Registriert allein reicht nicht.
 *
 * Die Aktionen sind ueber ihre Id auch ohne die Seite aufrufbar; das Gate
 * darf deshalb nicht in der Oberflaeche liegen. Und die Identitaet kommt aus
 * lib/session.ts, nie aus dem Formular.
 */

/** Einen Strain fuer die laufende Runde vorschlagen. */
export async function vorschlagEinreichen(formData: FormData): Promise<UmfrageErgebnis> {
  const mitglied = await freigabeErforderlich();
  const w = await holeWoerterbuchAusAnfrage();

  const geprueft = vorschlagEingabePruefen(
    String(formData.get("umfrageId") ?? ""),
    String(formData.get("strainId") ?? ""),
    String(formData.get("begruendung") ?? ""),
  );
  if (!geprueft.ok) return { ok: false, fehler: meldungText(w, geprueft.fehler) };

  const prisma = await getPrisma();

  // Die Phase gehoert geprueft, bevor geschrieben wird: nach dem Wechsel in
  // die Abstimmung nimmt die Runde keine Vorschlaege mehr an. Anders als bei
  // der Stimme gibt es dafuer keinen Trigger - ein spaeter Vorschlag ist
  // nicht gefaehrlich, nur falsch.
  const umfrage = await prisma.umfrage.findUnique({
    where: { id: geprueft.wert.umfrageId },
    select: { phase: true, vorschlagBisAm: true },
  });
  if (!umfrage) return { ok: false, fehler: w.meldung["umfrage.gibtEsNicht"] };
  // Auch nach Ablauf der Frist nicht mehr (Review 2026-09-28: sie stand nur auf dem Stimmzettel).
  if (!nimmtVorschlaegeAn(umfrage)) {
    return { ok: false, fehler: w.meldung["umfrage.keineVorschlaege"] };
  }

  try {
    await prisma.umfrageVorschlag.create({
      data: {
        umfrageId: geprueft.wert.umfrageId,
        strainId: geprueft.wert.strainId,
        mitgliedId: mitglied.mitgliedId,
        begruendung: geprueft.wert.begruendung,
      },
    });
  } catch (fehler) {
    // Unique (umfrageId, mitgliedId, strainId): derselbe Vorschlag zweimal.
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: w.meldung["umfrage.schonVorgeschlagen"] };
    }
    throw fehler;
  }

  revalidiereSprachen("/umfragen");
  return { ok: true };
}

/**
 * Die eine Stimme abgeben.
 *
 * Doppelstimmen verhindert der Unique-Index `(umfrage_id, mitglied_id)`,
 * nicht eine Pruefung vor dem Schreiben: D1 hat keine Transaktionen, und
 * "erst lesen, dann schreiben" waere eine Race Condition. Dass die Option zur
 * Runde gehoert, COMMUNITY ist und die Runde abstimmt, prueft zusaetzlich ein
 * Trigger in db/constraints.sql - die Pruefung hier ist die, die eine
 * verstaendliche Meldung erzeugt.
 */
export async function stimmeAbgeben(formData: FormData): Promise<UmfrageErgebnis> {
  const mitglied = await freigabeErforderlich();
  const w = await holeWoerterbuchAusAnfrage();

  const geprueft = stimmeEingabePruefen(
    String(formData.get("umfrageId") ?? ""),
    String(formData.get("optionId") ?? ""),
  );
  if (!geprueft.ok) return { ok: false, fehler: meldungText(w, geprueft.fehler) };

  const { umfrageId, optionId } = geprueft.wert;
  const prisma = await getPrisma();

  const option = await prisma.umfrageOption.findUnique({
    where: { id: optionId },
    select: { umfrageId: true, herkunft: true, umfrage: { select: { phase: true } } },
  });

  if (!option || option.umfrageId !== umfrageId) {
    return { ok: false, fehler: w.meldung["umfrage.kandidatFehlt"] };
  }
  if (option.umfrage.phase !== "ABSTIMMUNG") {
    return { ok: false, fehler: w.meldung["umfrage.keineAbstimmung"] };
  }
  if (option.herkunft !== "COMMUNITY") {
    return {
      ok: false,
      fehler: w.meldung["umfrage.gesetzt"],
    };
  }

  try {
    await prisma.stimme.create({
      data: { umfrageId, optionId, mitgliedId: mitglied.mitgliedId },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: w.meldung["umfrage.schonAbgestimmt"] };
    }
    throw fehler;
  }

  revalidiereSprachen("/umfragen");
  revalidiereSprachen("/");
  return { ok: true };
}
