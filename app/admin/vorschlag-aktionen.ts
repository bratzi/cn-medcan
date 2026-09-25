"use server";

import { revalidatePath } from "next/cache";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { benachrichtigen, nachrichtenFuer, textAbgelehnt, textFreigegeben } from "@/lib/benachrichtigung";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { strainIdAusSlug, unternehmensIdAusSchluessel, unternehmensSchluessel } from "@/lib/stamm-id";
import { blueteFreigabePruefen, freigabeKonflikt, terpeneNachtragen } from "@/lib/vorschlag-eingabe";
import type { BenachrichtigungArt, VorschlagStatus } from "@/db/enums";

export type AdminVorschlagErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Entscheidungen des Betreibers ueber Bluetenvorschlaege (Spec 4.2). D1 hat
 * keine Transaktionen: jeder Schritt ist so gebaut, dass ein zweiter Klick
 * nach einem Abbruch zum selben Ergebnis fuehrt.
 */

async function offeneLaden(schluessel: string) {
  const prisma = await getPrisma();
  return prisma.sortenVorschlag.findMany({
    where: { schluessel, status: "OFFEN" },
    select: { id: true, mitgliedId: true, handelsname: true },
    take: 200,
  });
}

/**
 * Benachrichtigt und schliesst die Vorschlaege. Erst die Nachricht, dann der
 * Status: bricht es dazwischen ab, bleibt der Vorschlag offen und ein zweiter
 * Klick holt es nach (schlimmstenfalls eine doppelte Nachricht, nie eine fehlende).
 */
async function abschliessen(
  offene: { id: string; mitgliedId: string }[],
  status: Exclude<VorschlagStatus, "OFFEN">,
  nachricht: { art: BenachrichtigungArt; text: string; link: string | null },
  felder: { strainId?: string; begruendung?: string | null },
) {
  await benachrichtigen(nachrichtenFuer(offene.map((v) => v.mitgliedId), nachricht));
  const prisma = await getPrisma();
  await prisma.sortenVorschlag.updateMany({
    where: { id: { in: offene.map((v) => v.id) }, status: "OFFEN" },
    data: { status, entschiedenAm: new Date(), ...felder },
  });
}

/** Hersteller finden oder mit der Id-Regel des Importskripts anlegen. */
async function herstellerSichern(name: string): Promise<string | null> {
  const schluessel = unternehmensSchluessel(name);
  if (!schluessel) return null;
  const prisma = await getPrisma();
  const id = await unternehmensIdAusSchluessel(schluessel);
  const vorhanden = await prisma.unternehmen.findFirst({
    where: { OR: [{ id }, { name: name.trim(), rolle: { in: ["HERSTELLER", "BEIDES"] } }] },
    select: { id: true },
  });
  if (vorhanden) return vorhanden.id;
  try {
    await prisma.unternehmen.create({ data: { id, name: name.trim(), rolle: "HERSTELLER" } });
  } catch (fehler) {
    if (!istEindeutigkeitsfehler(fehler)) throw fehler;
  }
  return id;
}

function neuLaden(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/vorschlaege");
  revalidatePath("/mitglied");
  revalidatePath("/produkte");
  if (slug) revalidatePath(`/produkte/${slug}`);
}

export async function blueteFreigeben(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const geprueft = blueteFreigabePruefen(formData, await terpenNamen());
  if (!geprueft.ok) return geprueft;
  const w = geprueft.wert;

  const offene = await offeneLaden(w.vorschlagSchluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  const strainId = await strainIdAusSlug(w.slug);
  const vorhanden = await blueteVorhanden(w.slug, w.handelsname);
  const konflikt = freigabeKonflikt(strainId, vorhanden);
  if (konflikt) {
    return {
      ok: false,
      fehler: `Unter diesem Namen steht schon eine Blüte im Katalog (${konflikt.slug}). Ordne die Vorschläge ihr zu.`,
    };
  }

  const prisma = await getPrisma();
  // Gibt es die Bluete mit genau dieser Id schon (Doppelklick, Import), bleibt
  // sie, wie sie ist: nur die Vorschlaege werden geschlossen.
  if (!vorhanden) {
    const herstellerId = w.hersteller ? await herstellerSichern(w.hersteller) : null;
    try {
      await prisma.strain.create({
        data: {
          id: strainId,
          slug: w.slug,
          handelsname: w.handelsname,
          darreichungsform: "BLUETE",
          kultivarName: w.kultivarName,
          kultivarTyp: w.kultivarTyp,
          thcMinProzent: w.thcMin,
          thcMaxProzent: w.thcMax,
          cbdMinProzent: w.cbdMin,
          cbdMaxProzent: w.cbdMax,
          bestrahlung: w.bestrahlung,
          anbauland: w.anbauland,
          herstellerId,
          // wie das Importskript: Name, Kultivar, Genetik klein
          suchtext: [w.handelsname, w.kultivarName].filter(Boolean).join(" ").toLowerCase(),
        },
      });
    } catch (fehler) {
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    }
  }

  // Terpene auch beim zweiten Klick nachholen, wenn der erste nach dem Anlegen
  // abbrach; eine vorhandene Bluete mit eigenen Terpenen bleibt, wie sie ist.
  const gleicheId = vorhanden?.id === strainId;
  const vorhandeneTerpene =
    w.terpene.length && gleicheId ? await prisma.strainTerpen.count({ where: { strainId } }) : 0;
  if (terpeneNachtragen({ gewaehlt: w.terpene.length, neuAngelegt: !vorhanden, gleicheId, vorhandeneTerpene })) {
    const terpene = await prisma.terpen.findMany({
      where: { name: { in: w.terpene } },
      select: { id: true, name: true },
    });
    const idNachName = new Map(terpene.map((t) => [t.name, t.id]));
    await prisma.strainTerpen.deleteMany({ where: { strainId } });
    await prisma.strainTerpen.createMany({
      data: w.terpene
        .filter((name) => idNachName.has(name))
        .map((name, index) => ({ strainId, terpenId: idNachName.get(name)!, rang: index + 1 })),
    });
  }

  const slug = vorhanden?.slug ?? w.slug;
  const name = vorhanden?.handelsname ?? w.handelsname;
  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { art: "VORSCHLAG_FREIGEGEBEN", text: textFreigegeben(name), link: `/produkte/${slug}` },
    { strainId: vorhanden?.id ?? strainId },
  );
  neuLaden(slug);
  return { ok: true };
}

export async function blueteAblehnen(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const schluessel = String(formData.get("vorschlagSchluessel") ?? "").trim();
  const begruendung = String(formData.get("begruendung") ?? "").trim().slice(0, 300) || null;
  if (!schluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };

  const offene = await offeneLaden(schluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  await abschliessen(
    offene,
    "ABGELEHNT",
    { art: "VORSCHLAG_ABGELEHNT", text: textAbgelehnt(offene[0].handelsname, begruendung), link: "/mitglied" },
    { begruendung },
  );
  neuLaden();
  return { ok: true };
}

export async function blueteZuordnen(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const schluessel = String(formData.get("vorschlagSchluessel") ?? "").trim();
  const strainId = String(formData.get("strainId") ?? "").trim();
  if (!schluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };
  if (!strainId) return { ok: false, fehler: "Bitte eine Blüte aus dem Katalog wählen." };

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: strainId },
    select: { id: true, slug: true, handelsname: true },
  });
  if (!strain) return { ok: false, fehler: "Diese Blüte gibt es nicht." };

  const offene = await offeneLaden(schluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { art: "VORSCHLAG_FREIGEGEBEN", text: textFreigegeben(strain.handelsname), link: `/produkte/${strain.slug}` },
    { strainId: strain.id },
  );
  neuLaden(strain.slug);
  return { ok: true };
}
