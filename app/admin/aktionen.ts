"use server";

import { revalidatePath } from "next/cache";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { freigabeEingabePruefen, rolleEingabePruefen } from "@/lib/admin-eingabe";

export type AdminErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Freigabe eines Mitglieds setzen oder zuruecknehmen.
 *
 * `adminErforderlich()` steht bewusst als erste Zeile: die Aktion ist ueber
 * ihre Id auch ohne die Seite aufrufbar, das Gate darf also nicht in der
 * Oberflaeche liegen. D1 kennt keine Zugriffskontrolle - wer hier vorbeikommt,
 * schreibt.
 */
export async function freigabeSetzen(formData: FormData): Promise<AdminErgebnis> {
  const admin = await adminErforderlich();

  const geprueft = freigabeEingabePruefen(
    String(formData.get("mitgliedId") ?? ""),
    String(formData.get("aktion") ?? ""),
    admin.mitgliedId,
  );
  if (!geprueft.ok) return geprueft;

  const { mitgliedId, freigegeben } = geprueft.wert;
  const prisma = await getPrisma();
  await prisma.mitglied.update({
    where: { id: mitgliedId },
    data: {
      freigegeben,
      // Die Spur, wer wann freigegeben hat. Beim Zuruecknehmen wird sie
      // geleert - eine stehengebliebene Freigabe-Spur ohne Freigabe waere
      // spaeter nicht zu deuten.
      freigegebenAm: freigegeben ? new Date() : null,
      freigegebenVon: freigegeben ? admin.mitgliedId : null,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

/** Rolle eines Mitglieds setzen (MITGLIED / FACHKREIS / ADMIN). */
export async function rolleSetzen(formData: FormData): Promise<AdminErgebnis> {
  const admin = await adminErforderlich();

  const geprueft = rolleEingabePruefen(
    String(formData.get("mitgliedId") ?? ""),
    String(formData.get("rolle") ?? ""),
    admin.mitgliedId,
  );
  if (!geprueft.ok) return geprueft;

  const prisma = await getPrisma();
  await prisma.mitglied.update({
    where: { id: geprueft.wert.mitgliedId },
    data: { rolle: geprueft.wert.rolle },
  });

  revalidatePath("/admin");
  return { ok: true };
}
