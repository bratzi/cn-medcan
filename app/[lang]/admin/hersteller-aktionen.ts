"use server";

import { herstellerPruefen } from "@/lib/hersteller-eingabe";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { adminErforderlich } from "@/lib/session";

export type HerstellerErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Name, Website und Logo eines Unternehmens pflegen (admin/hersteller, Spec 2026-10-21, 3).
 * Nur ADMIN; das Recht prüft die Aktion selbst, das Layout schützt keine Server Actions.
 */
export async function herstellerSpeichern(daten: FormData): Promise<HerstellerErgebnis> {
  await adminErforderlich();
  const pruefung = herstellerPruefen(daten);
  if (!pruefung.ok) return pruefung;
  const { id, name, website, logoPfad } = pruefung.daten;
  const prisma = await getPrisma();
  try {
    const { count } = await prisma.unternehmen.updateMany({ where: { id }, data: { name, website, logoPfad } });
    if (count === 0) return { ok: false, fehler: "Das Unternehmen gibt es nicht mehr." };
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) return { ok: false, fehler: "Diesen Namen trägt schon ein Unternehmen mit derselben Rolle." };
    throw fehler;
  }
  revalidiereSprachen("/admin/hersteller");
  revalidiereSprachen("/blueten", "layout");
  return { ok: true };
}
