"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { bildStatusFuer, bilderFrei } from "@/lib/bewertungsbilder";
import { BEWERTUNGSBILD_MAX, BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE, BUDPIC_MAX_OFFEN, istBudpicId } from "@/lib/budpics";
import { bildPruefen } from "@/lib/bild-pruefen";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";
import type { Meldung } from "@/lib/i18n/typen";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";

export type BewertungsbildErgebnis = { ok: true; id: string; sofortSichtbar: boolean } | { ok: false; fehler: string };
export type BewertungsbildEntfernenErgebnis = { ok: true } | { ok: false; fehler: string };

/** /admin immer; Blütenseite, Katalog und Startseite nur, wenn das Bild öffentlich war oder ist. */
function neuLaden(slug: string, oeffentlich: boolean) {
  revalidiereSprachen("/admin");
  if (!oeffentlich) return;
  revalidiereSprachen(`/blueten/${slug}`);
  revalidiereSprachen("/blueten");
  revalidiereSprachen("/");
  revalidiereSprachen("/reviews", "layout");
}

/**
 * Ein Bild zur eigenen Bewertung (Spec 2026-10-06). Eine Datei je Aufruf, wie
 * budpicHochladen: der Browser hat sie schon verkleinert, der Server prüft
 * trotzdem Größe (vor dem Lesen), Typ und Maße. Mitglied und Bewertung kommen
 * aus der Sitzung, nie aus dem Formular. Der Betreiber zeigt sofort, alle
 * anderen warten auf die Freigabe in /admin. Nur das INSERT ist atomar, die Grenze nicht: der Client sendet strikt nacheinander.
 */
export async function bewertungsbildHochladen(formData: FormData): Promise<BewertungsbildErgebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  const fehler = (meldung: Meldung): BewertungsbildErgebnis => ({ ok: false, fehler: meldungText(w, meldung) });

  let mitglied: Awaited<ReturnType<typeof freigabeErforderlich>>;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return fehler({ schluessel: "budpic.nurFreigeschaltet" });
  }

  const datei = formData.get("bild");
  if (!(datei instanceof File) || datei.size === 0) return fehler({ schluessel: "bild.fehlt" });
  // Vor dem Einlesen ablehnen: ein großer Body soll keinen Speicher kosten.
  if (datei.size > BUDPIC_MAX_BYTES) return fehler({ schluessel: "bild.zuGross", parameter: { max: BUDPIC_MAX_BYTES / 1024 } });
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const geprueft = bildPruefen(bytes, { maxBytes: BUDPIC_MAX_BYTES, maxBreite: BUDPIC_MAX_KANTE, maxHoehe: BUDPIC_MAX_KANTE });
  if (!geprueft.ok) return fehler(geprueft.fehler);

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: String(formData.get("strainId") ?? "") },
    select: { id: true, slug: true, aktiv: true },
  });
  if (!strain || !strain.aktiv) return fehler({ schluessel: "budpic.sorteUnbekannt" });

  const review = await prisma.review.findUnique({
    where: { autorId_strainId: { autorId: mitglied.mitgliedId, strainId: strain.id } },
    select: { id: true, bilder: { select: { status: true }, take: 50 } },
  });
  if (!review) return fehler({ schluessel: "bewertungsbild.ohneBewertung" });
  if (bilderFrei(review.bilder.map((b) => b.status)) === 0) {
    return fehler({ schluessel: "bewertungsbild.zuViele", parameter: { max: BEWERTUNGSBILD_MAX } });
  }

  const status = bildStatusFuer(mitglied.rolle);
  if (status === "OFFEN") {
    // Dieselbe Warteschlange wie die Budpics: dieselbe Grenze je Mitglied.
    const offen = await prisma.budpic.count({ where: { mitgliedId: mitglied.mitgliedId, status: "OFFEN" } });
    if (offen >= BUDPIC_MAX_OFFEN) return fehler({ schluessel: "budpic.zuVieleOffen", parameter: { max: BUDPIC_MAX_OFFEN } });
  }

  const bild = await prisma.budpic.create({
    data: {
      strainId: strain.id,
      mitgliedId: mitglied.mitgliedId,
      reviewId: review.id,
      daten: bytes,
      breite: geprueft.breite,
      hoehe: geprueft.hoehe,
      status,
    },
    select: { id: true },
  });
  neuLaden(strain.slug, status === "FREIGEGEBEN");
  return { ok: true, id: bild.id, sofortSichtbar: status === "FREIGEGEBEN" };
}

/** Entfernt ein eigenes Bild einer Bewertung; fremde Bilder und freie Budpics bleiben unberührt. */
export async function bewertungsbildEntfernen(formData: FormData): Promise<BewertungsbildEntfernenErgebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  let mitglied: Awaited<ReturnType<typeof freigabeErforderlich>>;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return { ok: false, fehler: meldungText(w, { schluessel: "budpic.nurFreigeschaltet" }) };
  }
  const id = formData.get("id");
  const unbekannt = { ok: false as const, fehler: meldungText(w, { schluessel: "bewertungsbild.unbekannt" }) };
  if (!istBudpicId(id)) return unbekannt;

  const prisma = await getPrisma();
  const bild = await prisma.budpic.findFirst({
    where: { id, mitgliedId: mitglied.mitgliedId, reviewId: { not: null } },
    select: { status: true, strain: { select: { slug: true } } },
  });
  if (!bild) return unbekannt;
  await prisma.budpic.delete({ where: { id } });
  neuLaden(bild.strain.slug, bild.status === "FREIGEGEBEN");
  return { ok: true };
}
