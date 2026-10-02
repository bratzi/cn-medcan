"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { benachrichtigen, nachrichtenFuer, vorlageAbgelehnt, vorlageFreigegeben, type Nachricht } from "@/lib/benachrichtigung";
import { inHaeppchen } from "@/lib/haeppchen";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { strainIdAusSlug, unternehmensIdAusSchluessel, unternehmensSchluessel } from "@/lib/stamm-id";
import {
  blueteFreigabePruefen,
  freigabeKonflikt,
  herstellerRolleNachFreigabe,
  terpeneNachtragen,
} from "@/lib/vorschlag-eingabe";
import type { VorschlagStatus } from "@/db/enums";

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
  nachricht: Omit<Nachricht, "mitgliedId">,
  felder: { strainId?: string; begruendung?: string | null },
) {
  await benachrichtigen(nachrichtenFuer(offene.map((v) => v.mitgliedId), nachricht));
  const prisma = await getPrisma();
  const entschiedenAm = new Date();
  // Bis zu 200 Ids: in einer Abfrage risse das die Bind-Grenze von D1.
  for (const teil of inHaeppchen(offene.map((v) => v.id))) {
    await prisma.sortenVorschlag.updateMany({
      where: { id: { in: teil }, status: "OFFEN" },
      data: { status, entschiedenAm, ...felder },
    });
  }
}

/**
 * Bilder der Vorschlaege als OFFENE Budpics der Sorte uebernehmen (T10) und die
 * wartenden Zeilen loeschen. Je Bild erst anlegen, dann loeschen: bricht es ab,
 * bleibt der Vorschlag offen und ein zweiter Klick holt den Rest nach (im
 * schlimmsten Fall ein doppeltes Bild zur Pruefung, nie ein verlorenes).
 * Das Bild gehoert weiter dem Mitglied, das es beigetragen hat.
 */
async function bilderUebernehmen(offene: { id: string; mitgliedId: string }[], strainId: string) {
  const prisma = await getPrisma();
  for (const v of offene) {
    const bilder = await prisma.sortenVorschlagBild.findMany({ where: { vorschlagId: v.id }, take: 10 });
    for (const bild of bilder) {
      await prisma.budpic.create({
        data: { strainId, mitgliedId: v.mitgliedId, daten: bild.daten, breite: bild.breite, hoehe: bild.hoehe },
      });
      await prisma.sortenVorschlagBild.delete({ where: { id: bild.id } });
    }
  }
}

/** Hersteller finden oder mit der Id-Regel des Importskripts anlegen. */
async function herstellerSichern(name: string): Promise<string | null> {
  const schluessel = unternehmensSchluessel(name);
  if (!schluessel) return null;
  const prisma = await getPrisma();
  const id = await unternehmensIdAusSchluessel(schluessel);
  const vorhanden = await prisma.unternehmen.findFirst({
    where: { OR: [{ id }, { name: name.trim(), rolle: { in: ["HERSTELLER", "BEIDES"] } }] },
    select: { id: true, rolle: true },
  });
  if (vorhanden) {
    // Bisher nur Importeur: jetzt auch Hersteller, wie im Importskript.
    const rolle = herstellerRolleNachFreigabe(vorhanden.rolle);
    if (rolle) {
      try {
        await prisma.unternehmen.update({ where: { id: vorhanden.id }, data: { rolle } });
      } catch (fehler) {
        // Gleicher Name schon als BEIDES: Id und Zuordnung stimmen trotzdem.
        if (!istEindeutigkeitsfehler(fehler)) throw fehler;
      }
    }
    return vorhanden.id;
  }
  try {
    await prisma.unternehmen.create({ data: { id, name: name.trim(), rolle: "HERSTELLER" } });
  } catch (fehler) {
    if (!istEindeutigkeitsfehler(fehler)) throw fehler;
  }
  return id;
}

function neuLaden(slug?: string) {
  revalidiereSprachen("/admin");
  revalidiereSprachen("/admin/vorschlaege");
  revalidiereSprachen("/mitglied");
  revalidiereSprachen("/blueten");
  if (slug) revalidiereSprachen(`/blueten/${slug}`);
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
  const konflikt = freigabeKonflikt(strainId, w.handelsname, vorhanden);
  if (konflikt) {
    return {
      ok: false,
      fehler: `Unter diesem Namen steht schon eine Blüte in der Datenbank (${konflikt.handelsname}, ${konflikt.slug}). Ordne die Vorschläge ihr zu.`,
    };
  }

  const prisma = await getPrisma();
  // Gibt es die Bluete mit genau dieser Id schon (Doppelklick, Import), bleibt
  // sie, wie sie ist: nur die Vorschlaege werden geschlossen. War sie
  // abgeschaltet, kommt sie mit der Freigabe zurueck in den Katalog.
  let angelegt = false;
  if (vorhanden && !vorhanden.aktiv) {
    await prisma.strain.update({ where: { id: vorhanden.id }, data: { aktiv: true } });
  }
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
      angelegt = true;
    } catch (fehler) {
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
      // Hingenommen nur, wenn inzwischen genau diese Bluete steht (Import oder
      // zweiter Tab dazwischen). Sonst belegt eine andere Slug oder Namen.
      const dazwischen = await prisma.strain.findUnique({ where: { id: strainId }, select: { id: true } });
      if (!dazwischen) {
        return {
          ok: false,
          fehler: "Unter diesem Namen steht inzwischen eine andere Blüte in der Datenbank. Ordne die Vorschläge ihr zu.",
        };
      }
    }
  }

  // Terpene auch beim zweiten Klick nachholen, wenn der erste nach dem Anlegen
  // abbrach; eine vorhandene Bluete mit eigenen Terpenen bleibt, wie sie ist.
  // Nach einem hingenommenen P2002 zaehlt sie wie eine vorhandene: eigene
  // Terpene aus dem Import bleiben dann stehen.
  const gleicheId = !angelegt;
  const vorhandeneTerpene =
    w.terpene.length && gleicheId ? await prisma.strainTerpen.count({ where: { strainId } }) : 0;
  if (terpeneNachtragen({ gewaehlt: w.terpene.length, neuAngelegt: angelegt, gleicheId, vorhandeneTerpene })) {
    const terpene = await prisma.terpen.findMany({
      where: { name: { in: w.terpene } },
      select: { id: true, name: true },
    });
    const idNachName = new Map(terpene.map((t) => [t.name, t.id]));
    await prisma.strainTerpen.deleteMany({ where: { strainId } });
    try {
      await prisma.strainTerpen.createMany({
        data: w.terpene
          .filter((name) => idNachName.has(name))
          .map((name, index) => ({ strainId, terpenId: idNachName.get(name)!, rang: index + 1 })),
      });
    } catch (fehler) {
      // Freigabe aus zwei Tabs: der andere hat dieselben Zeilen eben geschrieben.
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    }
  }

  const slug = vorhanden?.slug ?? w.slug;
  const name = vorhanden?.handelsname ?? w.handelsname;
  await bilderUebernehmen(offene, vorhanden?.id ?? strainId);
  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { ...vorlageFreigegeben(name), link: `/blueten/${slug}` },
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

  const prisma = await getPrisma();
  for (const teil of inHaeppchen(offene.map((v) => v.id))) {
    await prisma.sortenVorschlagBild.deleteMany({ where: { vorschlagId: { in: teil } } });
  }
  await abschliessen(
    offene,
    "ABGELEHNT",
    { ...vorlageAbgelehnt(offene[0].handelsname, begruendung), link: "/mitglied" },
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
    select: { id: true, slug: true, handelsname: true, aktiv: true },
  });
  if (!strain) return { ok: false, fehler: "Diese Blüte gibt es nicht." };

  const offene = await offeneLaden(schluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  // Wie bei der Freigabe: eine abgeschaltete Blüte kommt zurück in den Katalog,
  // sonst zeigte die Benachrichtigung auf eine Seite, die es nicht gibt.
  if (!strain.aktiv) await prisma.strain.update({ where: { id: strain.id }, data: { aktiv: true } });

  await bilderUebernehmen(offene, strain.id);
  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { ...vorlageFreigegeben(strain.handelsname), link: `/blueten/${strain.slug}` },
    { strainId: strain.id },
  );
  neuLaden(strain.slug);
  return { ok: true };
}
