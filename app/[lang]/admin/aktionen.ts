"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { adminErforderlich } from "@/lib/session";
import { kennwerteFortschreiben } from "@/lib/kennwerte";
import { getPrisma } from "@/lib/prisma";
import { profilFortschreiben } from "@/lib/query/profil";
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

  revalidiereSprachen("/admin");
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

  revalidiereSprachen("/admin");
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
  revalidiereSprachen("/admin");
  revalidiereSprachen("/");
  revalidiereSprachen("/reviews", "layout");
  revalidiereSprachen(`/blueten/${slug}`);
}

/**
 * Das öffentliche Netz zählt nur freigegebene Bewertungen (Profil Stufe 2,
 * Review W1): nach Freigabe und Verwerfen das Profil des Autors neu rechnen.
 * Scheitert das, bleibt die Freigabe gültig; der alte Stand gilt bis zur
 * nächsten Rechnung (Speichern oder /profil nach 24 h).
 */
async function oeffentlichesNetzFortschreiben(autorId: string | null): Promise<void> {
  if (!autorId) return;
  await profilFortschreiben(autorId).catch((fehler) => console.error("profilFortschreiben nach Freigabe fehlgeschlagen", fehler));
}

/** Community-Bewertung freigeben - danach ist sie oeffentlich sichtbar. */
export async function bewertungFreigeben(formData: FormData): Promise<AdminErgebnis> {
  await adminErforderlich();

  const geprueft = reviewIdPruefen(String(formData.get("reviewId") ?? ""));
  if (!geprueft.ok) return geprueft;

  const slug = await reviewSlug(geprueft.wert);
  if (!slug) return { ok: false, fehler: "Die Bewertung gibt es nicht mehr." };

  const prisma = await getPrisma();
  const review = await prisma.review.update({ where: { id: geprueft.wert }, data: { freigegeben: true }, select: { strainId: true, autorId: true } });
  await kennwerteFortschreiben(review.strainId);
  await oeffentlichesNetzFortschreiben(review.autorId);

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
  const review = await prisma.review.delete({ where: { id: geprueft.wert }, select: { strainId: true, autorId: true } });
  await kennwerteFortschreiben(review.strainId);
  await oeffentlichesNetzFortschreiben(review.autorId);

  bewertungPfadeNeuLaden(slug);
  return { ok: true };
}

/**
 * Kennwerte bewerteter Handelsnamen neu rechnen, in Stuecken zu 5.
 *
 * Auf dem Free-Plan gilt 10 ms CPU je Anfrage; je Handelsname laufen etwa
 * sechs Abfragen nacheinander. Der Aufrufer ruft deshalb mit `weiter` erneut,
 * bis es `null` ist. Das Gate steht als erste Zeile; mehrfaches Ausfuehren ist
 * harmlos (reines Neurechnen aus den Bewertungen).
 */
export async function kennwerteNeuRechnen(
  nach?: string | null,
): Promise<{ ok: true; anzahl: number; weiter: string | null }> {
  await adminErforderlich();

  const prisma = await getPrisma();
  let weiter: string | null = null;
  let fehler = false;
  try {
    const ids = await prisma.review.findMany({
      where: { freigegeben: true, ...(nach ? { strainId: { gt: nach } } : {}) },
      select: { strainId: true },
      distinct: ["strainId"],
      orderBy: { strainId: "asc" },
      take: 5,
    });
    let anzahl = 0;
    for (const { strainId } of ids) {
      await kennwerteFortschreiben(strainId);
      anzahl += 1;
    }
    if (ids.length === 5) weiter = ids[4].strainId;
    return { ok: true, anzahl, weiter };
  } catch (e) {
    fehler = true;
    throw e;
  } finally {
    // Nur im letzten Stueck oder bei Fehler neu laden, nicht fuenfmal.
    if (weiter === null || fehler) revalidiereSprachen("/", "layout");
  }
}
