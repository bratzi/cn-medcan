"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";

export type AdminUmfrageErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Die Steuerung der Umfragen - ausschliesslich fuer den Betreiber.
 *
 * Jede Aktion beginnt mit `adminErforderlich()`. Sie sind ueber ihre Id auch
 * ohne die Seite aufrufbar; D1 kennt keine Zugriffskontrolle, wer hier
 * vorbeikommt, schreibt.
 */

/** Naechste freie Reihenfolge einer Runde. Siehe Hinweis in den Aufrufern. */
async function naechsteReihenfolge(umfrageId: string): Promise<number> {
  const prisma = await getPrisma();
  const letzte = await prisma.umfrageOption.findFirst({
    where: { umfrageId },
    orderBy: { reihenfolge: "desc" },
    select: { reihenfolge: true },
  });
  return (letzte?.reihenfolge ?? 0) + 1;
}

/**
 * Einen Vorschlag als Kandidaten uebernehmen.
 *
 * Der Vorschlag bleibt erhalten und wird nur als `uebernommen` markiert -
 * so bleibt nachvollziehbar, von wem die Sorte kam.
 */
export async function vorschlagUebernehmen(
  formData: FormData,
): Promise<AdminUmfrageErgebnis> {
  await adminErforderlich();

  const vorschlagId = String(formData.get("vorschlagId") ?? "").trim();
  if (!vorschlagId) return { ok: false, fehler: "Kein Vorschlag angegeben." };

  const prisma = await getPrisma();
  const vorschlag = await prisma.umfrageVorschlag.findUnique({
    where: { id: vorschlagId },
    select: {
      umfrageId: true,
      strainId: true,
      uebernommen: true,
      umfrage: { select: { phase: true } },
    },
  });
  if (!vorschlag) return { ok: false, fehler: "Diesen Vorschlag gibt es nicht." };
  if (vorschlag.uebernommen) {
    return { ok: false, fehler: "Dieser Vorschlag ist bereits übernommen." };
  }
  if (vorschlag.umfrage.phase === "BEENDET") {
    return { ok: false, fehler: "Die Runde ist beendet." };
  }

  try {
    await prisma.umfrageOption.create({
      data: {
        umfrageId: vorschlag.umfrageId,
        strainId: vorschlag.strainId,
        herkunft: "COMMUNITY",
        reihenfolge: await naechsteReihenfolge(vorschlag.umfrageId),
      },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: "Dieser Strain steht in dieser Runde schon auf der Liste." };
    }
    throw fehler;
  }

  await prisma.umfrageVorschlag.update({
    where: { id: vorschlagId },
    data: { uebernommen: true },
  });

  revalidiereSprachen("/admin");
  revalidiereSprachen("/sotm");
  return { ok: true };
}

/**
 * Eine Bewertung als Ergebnis eines Platzes hinterlegen.
 *
 * Damit schliesst sich die Schleife, die das Alleinstellungsmerkmal ist:
 * Vorschlag, Abstimmung, Test, Bewertung.
 */
export async function ergebnisVerknuepfen(
  formData: FormData,
): Promise<AdminUmfrageErgebnis> {
  await adminErforderlich();

  const optionId = String(formData.get("optionId") ?? "").trim();
  const reviewIdRoh = String(formData.get("reviewId") ?? "").trim();
  if (!optionId) return { ok: false, fehler: "Kein Kandidat angegeben." };

  const prisma = await getPrisma();
  const option = await prisma.umfrageOption.findUnique({
    where: { id: optionId },
    select: { strainId: true },
  });
  if (!option) return { ok: false, fehler: "Diesen Kandidaten gibt es nicht." };

  // Leer bedeutet "Verknuepfung loesen".
  if (reviewIdRoh.length === 0) {
    await prisma.umfrageOption.update({
      where: { id: optionId },
      data: { ergebnisReviewId: null },
    });
    revalidiereSprachen("/admin");
    revalidiereSprachen("/sotm");
    return { ok: true };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewIdRoh },
    select: { strainId: true },
  });
  if (!review) return { ok: false, fehler: "Diese Bewertung gibt es nicht." };
  // Eine Bewertung einer anderen Sorte als Ergebnis dieses Platzes waere
  // schlicht falsch und faellt sonst niemandem auf.
  if (review.strainId !== option.strainId) {
    return { ok: false, fehler: "Die Bewertung gehört zu einem anderen Strain." };
  }

  await prisma.umfrageOption.update({
    where: { id: optionId },
    data: { ergebnisReviewId: reviewIdRoh },
  });

  revalidiereSprachen("/admin");
  revalidiereSprachen("/sotm");
  return { ok: true };
}
