"use server";

import { revalidatePath } from "next/cache";

import { freigabeErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { stimmeEingabePruefen, vorschlagEingabePruefen } from "@/lib/umfrage-eingabe";

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

  const geprueft = vorschlagEingabePruefen(
    String(formData.get("umfrageId") ?? ""),
    String(formData.get("strainId") ?? ""),
    String(formData.get("begruendung") ?? ""),
  );
  if (!geprueft.ok) return geprueft;

  const prisma = await getPrisma();

  // Die Phase gehoert geprueft, bevor geschrieben wird: nach dem Wechsel in
  // die Abstimmung nimmt die Runde keine Vorschlaege mehr an. Anders als bei
  // der Stimme gibt es dafuer keinen Trigger - ein spaeter Vorschlag ist
  // nicht gefaehrlich, nur falsch.
  const umfrage = await prisma.umfrage.findUnique({
    where: { id: geprueft.wert.umfrageId },
    select: { phase: true },
  });
  if (!umfrage) return { ok: false, fehler: "Diese Umfrage gibt es nicht." };
  if (umfrage.phase !== "VORSCHLAG") {
    return { ok: false, fehler: "Diese Runde nimmt keine Vorschläge mehr an." };
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
      return { ok: false, fehler: "Diese Sorte hast du in dieser Runde schon vorgeschlagen." };
    }
    throw fehler;
  }

  revalidatePath("/umfragen");
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

  const geprueft = stimmeEingabePruefen(
    String(formData.get("umfrageId") ?? ""),
    String(formData.get("optionId") ?? ""),
  );
  if (!geprueft.ok) return geprueft;

  const { umfrageId, optionId } = geprueft.wert;
  const prisma = await getPrisma();

  const option = await prisma.umfrageOption.findUnique({
    where: { id: optionId },
    select: { umfrageId: true, herkunft: true, umfrage: { select: { phase: true } } },
  });

  if (!option || option.umfrageId !== umfrageId) {
    return { ok: false, fehler: "Diesen Kandidaten gibt es in dieser Runde nicht." };
  }
  if (option.umfrage.phase !== "ABSTIMMUNG") {
    return { ok: false, fehler: "In dieser Runde wird gerade nicht abgestimmt." };
  }
  if (option.herkunft !== "COMMUNITY") {
    return {
      ok: false,
      fehler: "Dieser Platz ist gesetzt und steht nicht zur Abstimmung.",
    };
  }

  try {
    await prisma.stimme.create({
      data: { umfrageId, optionId, mitgliedId: mitglied.mitgliedId },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: "Du hast in dieser Runde bereits abgestimmt." };
    }
    throw fehler;
  }

  revalidatePath("/umfragen");
  revalidatePath("/");
  return { ok: true };
}
