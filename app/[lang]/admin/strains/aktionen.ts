"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { revalidiereKatalog } from "@/lib/katalog/revalidieren";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { adminErforderlich } from "@/lib/session";
import { strainStammPruefen, strainSuchtext } from "@/lib/strain-stamm-eingabe";

export type StammErgebnis = { ok: true } | { ok: false; fehler: string } | null;

/**
 * Stammdaten einer Strain speichern (Spec 2026-10-21, Abschnitt 3). Gate als erste Zeile:
 * die Aktion ist über ihre Id auch ohne die Seite aufrufbar. Der Slug bleibt, damit Links halten.
 * D1 ohne Transaktion: Terpene werden ersetzt; ein zweites Speichern heilt einen Abbruch.
 */
export async function strainStammSpeichern(_vorher: StammErgebnis, formData: FormData): Promise<StammErgebnis> {
  await adminErforderlich();

  const geprueft = strainStammPruefen({
    strainId: String(formData.get("strainId") ?? ""),
    handelsname: String(formData.get("handelsname") ?? ""),
    kultivarId: String(formData.get("kultivarId") ?? ""),
    vertreiberId: String(formData.get("vertreiberId") ?? ""),
    kultivarTyp: String(formData.get("kultivarTyp") ?? ""),
    darreichungsform: String(formData.get("darreichungsform") ?? ""),
    thcMin: String(formData.get("thcMin") ?? ""),
    thcMax: String(formData.get("thcMax") ?? ""),
    cbdMin: String(formData.get("cbdMin") ?? ""),
    cbdMax: String(formData.get("cbdMax") ?? ""),
    terpene: formData.getAll("terpene").map(String),
    aktiv: formData.get("aktiv") === null ? undefined : String(formData.get("aktiv")),
  });
  if (!geprueft.ok) return geprueft;
  const w = geprueft.wert;

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({ where: { id: w.strainId }, select: { slug: true } });
  if (!strain) return { ok: false, fehler: "Strain nicht gefunden." };

  const kultivar = w.kultivarId
    ? await prisma.kultivar.findUnique({ where: { id: w.kultivarId }, select: { name: true, slug: true } })
    : null;
  if (w.kultivarId && !kultivar) return { ok: false, fehler: "Kultivar nicht gefunden." };
  if (w.vertreiberId && !(await prisma.unternehmen.findUnique({ where: { id: w.vertreiberId }, select: { id: true } }))) {
    return { ok: false, fehler: "Vertreiber nicht gefunden." };
  }
  if (w.terpenIds.length) {
    const da = await prisma.terpen.count({ where: { id: { in: w.terpenIds } } });
    if (da !== w.terpenIds.length) return { ok: false, fehler: "Ein Terpen ist unbekannt." };
  }

  try {
    await prisma.strain.update({
      where: { id: w.strainId },
      data: {
        handelsname: w.handelsname,
        kultivarId: w.kultivarId,
        kultivarName: kultivar?.name ?? null,
        vertreiberId: w.vertreiberId,
        kultivarTyp: w.kultivarTyp,
        darreichungsform: w.darreichungsform,
        thcMinProzent: w.thcMinProzent,
        thcMaxProzent: w.thcMaxProzent,
        cbdMinProzent: w.cbdMinProzent,
        cbdMaxProzent: w.cbdMaxProzent,
        aktiv: w.aktiv,
        suchtext: strainSuchtext(w.handelsname, kultivar?.name ?? null),
      },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) return { ok: false, fehler: "Diesen Handelsnamen gibt es schon." };
    throw fehler;
  }

  await prisma.strainTerpen.deleteMany({ where: { strainId: w.strainId } });
  if (w.terpenIds.length) {
    await prisma.strainTerpen.createMany({
      data: w.terpenIds.map((terpenId, i) => ({ strainId: w.strainId, terpenId, rang: i + 1 })),
    });
  }

  await revalidiereKatalog();
  revalidiereSprachen("/");
  revalidiereSprachen("/blueten");
  revalidiereSprachen(`/blueten/${strain.slug}`);
  if (kultivar?.slug) revalidiereSprachen(`/blueten/${kultivar.slug}`);
  revalidiereSprachen("/admin/strains", "layout");
  return { ok: true };
}
