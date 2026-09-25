"use server";

import { revalidatePath } from "next/cache";

import { bewertungPruefen } from "@/lib/bewertung-eingabe";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";

export type BewertungErgebnis = { ok: true; sofortSichtbar: boolean; slug: string } | { ok: false; fehler: string };

/**
 * Speichert eine Bewertung (Spec Redesign 17).
 *
 * Wer bewertet, kommt aus der Sitzung, nie aus dem Formular. Freigeschaltete
 * Mitglieder schreiben Community-Bewertungen, die erst nach Freigabe in
 * /admin erscheinen. Der Betreiber (ADMIN) schreibt redaktionell und sofort
 * sichtbar; nur er darf ein Reel verknüpfen. Terpene werden nur für die
 * Terpene der Sorte angenommen, alles andere im Formular wird ignoriert.
 */
export async function bewertungSpeichern(formData: FormData): Promise<BewertungErgebnis> {
  let mitglied;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return { ok: false, fehler: "Bewerten können nur freigeschaltete Mitglieder." };
  }
  const istBetreiber = mitglied.rolle === "ADMIN";

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: String(formData.get("strainId") ?? "") },
    select: { id: true, slug: true, aktiv: true },
  });
  if (!strain || !strain.aktiv) return { ok: false, fehler: "Diese Sorte gibt es nicht (mehr)." };

  // Alle bekannten Terpene: auch solche, die der Hersteller nicht angibt, die man aber schmeckt.
  const bekannte = await prisma.terpen.findMany({ select: { name: true } });
  const geprueft = bewertungPruefen(
    formData,
    bekannte.map((terpen) => terpen.name),
  );
  if (!geprueft.ok) return geprueft;
  const e = geprueft.wert;
  if (e.instagramReelUrl && !istBetreiber) return { ok: false, fehler: "Ein Reel verknüpft nur der Betreiber." };

  // Charge: vorhandene nehmen, sonst anlegen. Ohne Nummer bleibt die Bewertung ohne Charge.
  let chargeId: string | null = null;
  if (e.chargenNr) {
    const charge = await prisma.charge.upsert({
      where: { strainId_chargenNr: { strainId: strain.id, chargenNr: e.chargenNr } },
      create: { strainId: strain.id, chargenNr: e.chargenNr },
      update: {},
      select: { id: true },
    });
    chargeId = charge.id;
  }

  await prisma.review.create({
    data: {
      strainId: strain.id,
      chargeId,
      autorId: mitglied.mitgliedId,
      istRedaktionell: istBetreiber,
      freigegeben: istBetreiber,
      ...e.noten,
      feuchtigkeitProzent: e.feuchtigkeitProzent,
      geschmacksMatrix: JSON.stringify(e.geschmacksMatrix),
      terpenIntensitaet: Object.keys(e.terpenIntensitaet).length > 0 ? JSON.stringify(e.terpenIntensitaet) : null,
      beschaffenheit: Object.keys(e.beschaffenheit).length > 0 ? JSON.stringify(e.beschaffenheit) : null,
      notiz: e.notiz,
      instagramReelUrl: istBetreiber ? e.instagramReelUrl : null,
    },
  });

  revalidatePath(`/produkte/${strain.slug}`);
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, sofortSichtbar: istBetreiber, slug: strain.slug };
}
