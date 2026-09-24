"use server";

import { revalidatePath } from "next/cache";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { freigabeEingabePruefen, reviewIdPruefen, rolleEingabePruefen } from "@/lib/admin-eingabe";

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

/** Sorten-Slug einer Bewertung, fuer die Revalidierung der Produktseite. */
async function reviewSlug(reviewId: string): Promise<string | null> {
  const prisma = await getPrisma();
  const satz = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { strain: { select: { slug: true } } },
  });
  return satz?.strain.slug ?? null;
}

function bewertungPfadeNeuLaden(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produkte/${slug}`);
}

/** Community-Bewertung freigeben - danach ist sie oeffentlich sichtbar. */
export async function bewertungFreigeben(formData: FormData): Promise<AdminErgebnis> {
  await adminErforderlich();

  const geprueft = reviewIdPruefen(String(formData.get("reviewId") ?? ""));
  if (!geprueft.ok) return geprueft;

  const slug = await reviewSlug(geprueft.wert);
  if (!slug) return { ok: false, fehler: "Die Bewertung gibt es nicht mehr." };

  const prisma = await getPrisma();
  await prisma.review.update({ where: { id: geprueft.wert }, data: { freigegeben: true } });

  bewertungPfadeNeuLaden(slug);
  return { ok: true };
}

/** Community-Bewertung verwerfen - sie wird geloescht, nicht nur versteckt. */
export async function bewertungVerwerfen(formData: FormData): Promise<AdminErgebnis> {
  await adminErforderlich();

  const geprueft = reviewIdPruefen(String(formData.get("reviewId") ?? ""));
  if (!geprueft.ok) return geprueft;

  const slug = await reviewSlug(geprueft.wert);
  if (!slug) return { ok: false, fehler: "Die Bewertung gibt es nicht mehr." };

  const prisma = await getPrisma();
  await prisma.review.delete({ where: { id: geprueft.wert } });

  bewertungPfadeNeuLaden(slug);
  return { ok: true };
}
