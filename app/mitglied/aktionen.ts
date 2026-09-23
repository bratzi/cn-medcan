"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
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
