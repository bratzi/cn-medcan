"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
import { gelesenIdsPruefen } from "@/lib/benachrichtigung";
import { getPrisma } from "@/lib/prisma";
import { profilEingabePruefen } from "@/lib/mitglied-eingabe";

export type ProfilErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Anzeigename und Instagram-Handle des angemeldeten Mitglieds.
 *
 * Bewusst NICHT aenderbar: `freigegeben` und `rolle`. Beides vergibt der
 * Betreiber in /admin; waeren sie hier schreibbar, koennte sich jeder selbst
 * Stimmrecht geben. Die Aktion liest deshalb nur die zwei Felder aus dem
 * Formular und ignoriert alles andere darin.
 *
 * Die Zuordnung kommt aus lib/session.ts, nicht aus dem Formular - eine
 * mitgesendete Mitglieds-Id waere eine fremde Identitaet.
 */
export async function profilSpeichern(formData: FormData): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();

  const geprueft = profilEingabePruefen(
    String(formData.get("anzeigename") ?? ""),
    String(formData.get("instagramHandle") ?? ""),
  );
  if (!geprueft.ok) return geprueft;

  const prisma = await getPrisma();
  await prisma.mitglied.update({
    where: { id: mitglied.mitgliedId },
    data: geprueft.wert,
  });

  revalidatePath("/mitglied");
  return { ok: true };
}

/**
 * Die angezeigten Benachrichtigungen als gelesen markieren. Nur diese: aeltere
 * jenseits der Liste bleiben ungelesen, sonst verschwaende ihr "Neu", ohne dass
 * sie je zu sehen waren. Hoechstens 20 Ids, also weit unter der D1-Grenze.
 */
export async function benachrichtigungenGelesen(roh: unknown): Promise<void> {
  const mitglied = await mitgliedErforderlich();
  const ids = gelesenIdsPruefen(roh);
  if (ids.length === 0) return;
  const prisma = await getPrisma();
  await prisma.benachrichtigung.updateMany({
    where: { id: { in: ids }, mitgliedId: mitglied.mitgliedId, gelesenAm: null },
    data: { gelesenAm: new Date() },
  });
}
