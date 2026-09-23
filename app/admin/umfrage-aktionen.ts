"use server";

import { revalidatePath } from "next/cache";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import {
  gewinnerErmitteln,
  phasenwechselPruefen,
  umfrageEingabePruefen,
  type OptionFuerAuswertung,
} from "@/lib/umfrage-eingabe";

export type AdminUmfrageErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Die Steuerung der Umfragen - ausschliesslich fuer den Betreiber.
 *
 * Jede Aktion beginnt mit `adminErforderlich()`. Sie sind ueber ihre Id auch
 * ohne die Seite aufrufbar; D1 kennt keine Zugriffskontrolle, wer hier
 * vorbeikommt, schreibt.
 */

/**
 * Eine neue Runde anlegen.
 *
 * `aktiv: "AKTIV"` ist kein Zierrat: die Spalte traegt den Unique-Index, der
 * "genau eine aktive Umfrage" erzwingt. Laeuft schon eine, weist die
 * Datenbank den Satz ab - nicht eine Pruefung davor, die auf D1 ohne
 * Transaktion nichts garantieren wuerde.
 */
export async function umfrageAnlegen(formData: FormData): Promise<AdminUmfrageErgebnis> {
  await adminErforderlich();

  const geprueft = umfrageEingabePruefen(
    String(formData.get("titel") ?? ""),
    String(formData.get("beschreibung") ?? ""),
    String(formData.get("communityPlaetze") ?? "2"),
  );
  if (!geprueft.ok) return geprueft;

  const prisma = await getPrisma();
  try {
    await prisma.umfrage.create({
      data: {
        titel: geprueft.wert.titel,
        beschreibung: geprueft.wert.beschreibung,
        communityPlaetze: geprueft.wert.communityPlaetze,
        phase: "VORSCHLAG",
        aktiv: "AKTIV",
      },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return {
        ok: false,
        fehler: "Es läuft bereits eine Umfrage. Beende sie, bevor du eine neue anlegst.",
      };
    }
    throw fehler;
  }

  revalidatePath("/admin");
  revalidatePath("/umfragen");
  return { ok: true };
}

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
 * Einen gesetzten Platz vergeben - die Wahl des Betreibers, ohne Abstimmung.
 *
 * Hinweis zur Reihenfolge: sie wird gelesen und dann geschrieben, ohne
 * Transaktion (D1 hat keine). Zwei gleichzeitige Aufrufe koennen dieselbe
 * Zahl ziehen; der Unique-Index `(umfrage_id, reihenfolge)` weist den
 * zweiten dann ab, und der Betreiber klickt noch einmal. Das ist hier
 * vertretbar: es gibt genau einen Betreiber, und der Fehlerfall ist sichtbar
 * und harmlos - im Gegensatz zu einer stillen doppelten Vergabe.
 */
export async function gesetztenPlatzVergeben(
  formData: FormData,
): Promise<AdminUmfrageErgebnis> {
  await adminErforderlich();

  const umfrageId = String(formData.get("umfrageId") ?? "").trim();
  const strainId = String(formData.get("strainId") ?? "").trim();
  if (!umfrageId) return { ok: false, fehler: "Keine Umfrage angegeben." };
  if (!strainId) return { ok: false, fehler: "Bitte eine Sorte auswählen." };

  const prisma = await getPrisma();
  const umfrage = await prisma.umfrage.findUnique({
    where: { id: umfrageId },
    select: { phase: true },
  });
  if (!umfrage) return { ok: false, fehler: "Diese Umfrage gibt es nicht." };
  if (umfrage.phase === "BEENDET") {
    return { ok: false, fehler: "Die Runde ist beendet." };
  }

  try {
    await prisma.umfrageOption.create({
      data: {
        umfrageId,
        strainId,
        herkunft: "GESETZT",
        reihenfolge: await naechsteReihenfolge(umfrageId),
      },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: "Diese Sorte steht in dieser Runde schon auf der Liste." };
    }
    throw fehler;
  }

  revalidatePath("/admin");
  revalidatePath("/umfragen");
  return { ok: true };
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
      return { ok: false, fehler: "Diese Sorte steht in dieser Runde schon auf der Liste." };
    }
    throw fehler;
  }

  await prisma.umfrageVorschlag.update({
    where: { id: vorschlagId },
    data: { uebernommen: true },
  });

  revalidatePath("/admin");
  revalidatePath("/umfragen");
  return { ok: true };
}

/**
 * Die Phase weiterschalten.
 *
 * Nur vorwaerts, siehe `phasenwechselPruefen`. Beim Wechsel nach BEENDET
 * passiert dreierlei in einem Zug: Gewinner markieren, Enddatum setzen und
 * `aktiv` auf NULL - erst damit ist der Platz fuer die naechste Runde frei.
 */
export async function phaseWeiterschalten(
  formData: FormData,
): Promise<AdminUmfrageErgebnis> {
  await adminErforderlich();

  const umfrageId = String(formData.get("umfrageId") ?? "").trim();
  if (!umfrageId) return { ok: false, fehler: "Keine Umfrage angegeben." };

  const prisma = await getPrisma();
  const umfrage = await prisma.umfrage.findUnique({
    where: { id: umfrageId },
    select: {
      phase: true,
      communityPlaetze: true,
      optionen: {
        select: { id: true, herkunft: true, reihenfolge: true },
        take: 50,
      },
    },
  });
  if (!umfrage) return { ok: false, fehler: "Diese Umfrage gibt es nicht." };

  const geprueft = phasenwechselPruefen(
    umfrage.phase,
    String(formData.get("ziel") ?? ""),
  );
  if (!geprueft.ok) return geprueft;

  if (geprueft.wert.ziel === "ABSTIMMUNG") {
    const abstimmbar = umfrage.optionen.filter((o) => o.herkunft === "COMMUNITY").length;
    if (abstimmbar === 0) {
      return {
        ok: false,
        fehler:
          "Ohne übernommenen Vorschlag gibt es nichts zu wählen. Übernimm zuerst Kandidaten.",
      };
    }
    await prisma.umfrage.update({
      where: { id: umfrageId },
      data: { phase: "ABSTIMMUNG" },
    });
    revalidatePath("/admin");
    revalidatePath("/umfragen");
    revalidatePath("/");
    return { ok: true };
  }

  // Ziel BEENDET: Stimmen zaehlen und Gewinner markieren.
  const stimmenJeOption = await prisma.stimme.groupBy({
    by: ["optionId"],
    where: { umfrageId },
    _count: { _all: true },
  });
  const zaehler = new Map(stimmenJeOption.map((z) => [z.optionId, z._count._all]));

  const fuerAuswertung: OptionFuerAuswertung[] = umfrage.optionen.map((o) => ({
    id: o.id,
    herkunft: o.herkunft,
    reihenfolge: o.reihenfolge,
    stimmen: zaehler.get(o.id) ?? 0,
  }));
  const gewinnerIds = gewinnerErmitteln(fuerAuswertung, umfrage.communityPlaetze);

  // Zwei Schreibvorgaenge ohne Transaktion (D1). Reihenfolge deshalb bewusst:
  // erst die Gewinner setzen, dann die Runde schliessen. Bricht es dazwischen
  // ab, steht eine laufende Runde mit schon markierten Gewinnern da - das ist
  // sichtbar und nachbesserbar. Andersherum stuende eine beendete Runde ohne
  // Ergebnis, und der Betreiber koennte es nicht mehr nachtragen, weil
  // Phasen nur vorwaerts laufen.
  await prisma.umfrageOption.updateMany({
    where: { umfrageId, id: { in: gewinnerIds } },
    data: { istGewinner: true },
  });
  await prisma.umfrage.update({
    where: { id: umfrageId },
    data: { phase: "BEENDET", aktiv: null, endetAm: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/umfragen");
  revalidatePath("/");
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
    revalidatePath("/admin");
    revalidatePath("/umfragen");
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
    return { ok: false, fehler: "Die Bewertung gehört zu einer anderen Sorte." };
  }

  await prisma.umfrageOption.update({
    where: { id: optionId },
    data: { ergebnisReviewId: reviewIdRoh },
  });

  revalidatePath("/admin");
  revalidatePath("/umfragen");
  return { ok: true };
}
