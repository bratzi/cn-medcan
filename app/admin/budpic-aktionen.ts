"use server";

import { revalidatePath } from "next/cache";

import { istBudpicId } from "@/lib/budpics";
import { getPrisma } from "@/lib/prisma";
import { adminErforderlich } from "@/lib/session";

export type BudpicAdminErgebnis = { ok: true } | { ok: false; fehler: string };

/** Nach jeder Aenderung: die Sorte (Blueten-Seite), der Katalog, die Startseite und /admin. */
function neuLaden(slug: string | null) {
  revalidatePath("/admin");
  revalidatePath("/blueten");
  revalidatePath("/");
  if (slug) revalidatePath(`/blueten/${slug}`);
}

async function slugVon(id: string): Promise<{ slug: string } | null> {
  const prisma = await getPrisma();
  const satz = await prisma.budpic.findUnique({ where: { id }, select: { strain: { select: { slug: true } } } });
  return satz ? { slug: satz.strain.slug } : null;
}

/**
 * Setzt den Status eines Budpics oder loescht es. `adminErforderlich()` steht
 * als Erstes: die Aktion ist auch ohne die Seite aufrufbar (wie in
 * app/admin/aktionen.ts). Die id wird als UUID geprueft, bevor sie in eine
 * Abfrage geht.
 */
async function aendern(formData: FormData, was: "FREIGEGEBEN" | "ABGELEHNT" | "LOESCHEN"): Promise<BudpicAdminErgebnis> {
  await adminErforderlich();
  const id = formData.get("id");
  if (!istBudpicId(id)) return { ok: false, fehler: "Unbekanntes Bild." };
  const sorte = await slugVon(id);
  if (!sorte) return { ok: false, fehler: "Das Bild gibt es nicht mehr." };

  const prisma = await getPrisma();
  if (was === "LOESCHEN") await prisma.budpic.delete({ where: { id } });
  else await prisma.budpic.update({ where: { id }, data: { status: was } });
  neuLaden(sorte.slug);
  return { ok: true };
}

export async function budpicFreigeben(formData: FormData): Promise<BudpicAdminErgebnis> {
  return aendern(formData, "FREIGEGEBEN");
}

export async function budpicAblehnen(formData: FormData): Promise<BudpicAdminErgebnis> {
  return aendern(formData, "ABGELEHNT");
}

export async function budpicLoeschen(formData: FormData): Promise<BudpicAdminErgebnis> {
  return aendern(formData, "LOESCHEN");
}
