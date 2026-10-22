"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { revalidiereKatalog } from "@/lib/katalog/revalidieren";

import { bewertungPruefen } from "@/lib/bewertung-eingabe";
import { kennwerteFortschreiben } from "@/lib/kennwerte";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { platzhalterProdukt, waehleWare, waehleZielBewertung } from "@/lib/ware-wahl";
import { ladeProfil, profilFortschreiben } from "@/lib/query/profil";
import { netzGeformt, noteOderErsatz } from "@/lib/profil";
import type { Geschmack } from "@/lib/profil-typen";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";
import { holeSpracheAusAnfrage, holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { meldungText } from "@/lib/i18n/text";
import type { Meldung, Woerterbuch } from "@/lib/i18n/typen";
import type { BeschaffenheitsKey } from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";

export type BewertungErgebnis =
  | { ok: true; sofortSichtbar: boolean; slug: string; strainId: string; netz: { vorher: Geschmack | null; nachher: Geschmack; geformt: boolean } | null }
  | { ok: false; fehler: string };

/**
 * Speichert eine Bewertung (Spec Redesign 17).
 *
 * Wer bewertet, kommt aus der Sitzung, nie aus dem Formular. Freigeschaltete
 * Mitglieder schreiben Community-Bewertungen, die erst nach Freigabe in
 * /admin erscheinen. Der Betreiber (ADMIN) schreibt redaktionell und sofort
 * sichtbar; nur er darf ein Reel verknüpfen. Terpene werden nur für die
 * Terpene der Sorte angenommen, alles andere im Formular wird ignoriert.
 */
/**
 * Meldung in der Sprache der Anfrage. Die Pruefung nennt nur Schluessel und
 * Feld; der sichtbare Feldname kommt hier aus dem Woerterbuch.
 */
function text(w: Woerterbuch, sprache: Sprache, meldung: Meldung): string {
  const p = meldung.parameter ?? {};
  const label =
    typeof p.feld === "string"
      ? w.schema.noten[p.feld as keyof Woerterbuch["schema"]["noten"]]?.label
      : typeof p.geschmack === "string"
        ? w.label.geschmack[p.geschmack as GeschmacksKategorie]
        : typeof p.beschaffenheit === "string"
          ? w.schema.beschaffenheit[p.beschaffenheit as BeschaffenheitsKey]?.label
          : typeof p.terpen === "string"
            ? terpenAnzeige(p.terpen, sprache)
            : undefined;
  return meldungText(w, { ...meldung, parameter: label === undefined ? p : { ...p, label } });
}

/** Legt den Platzhalter je Sorte und Vertreiber an (oder liest ihn nach einem parallelen Anlegen); null bei fremdem Vertreiber. */
async function platzhalterAnlegen(kultivarId: string, kultivarName: string, kultivarSlug: string, vertreiberId: string) {
  const prisma = await getPrisma();
  const [vertreiber, vorlage] = await Promise.all([
    prisma.unternehmen.findFirst({ where: { id: vertreiberId, vertrieben: { some: { aktiv: true } } }, select: { id: true, name: true } }),
    prisma.strain.findFirst({
      where: { kultivarId, aktiv: true },
      orderBy: { handelsname: "asc" },
      select: { kultivarName: true, kultivarTyp: true, genetik: true, darreichungsform: true, thcMinProzent: true, thcMaxProzent: true, cbdMinProzent: true, cbdMaxProzent: true },
    }),
  ]);
  if (!vertreiber || !vorlage) return null;
  const daten = platzhalterProdukt({ id: kultivarId, name: kultivarName, slug: kultivarSlug }, vertreiber, vorlage);
  const auswahl = { id: true, slug: true, vertreiberId: true, handelsname: true, aktiv: true } as const;
  try {
    return await prisma.strain.create({ data: daten, select: auswahl });
  } catch (fehler) {
    if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    return prisma.strain.findUnique({ where: { slug: daten.slug }, select: auswahl });
  }
}

export async function bewertungSpeichern(formData: FormData): Promise<BewertungErgebnis> {
  const [w, sprache] = await Promise.all([holeWoerterbuchAusAnfrage(), holeSpracheAusAnfrage()]);
  let mitglied;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.nurFreigeschaltet" }) };
  }
  const istBetreiber = mitglied.rolle === "ADMIN";

  const prisma = await getPrisma();
  // Alle bekannten Terpene: auch solche, die der Hersteller nicht angibt, die man aber schmeckt.
  const bekannte = await prisma.terpen.findMany({ select: { name: true } });
  const geprueft = bewertungPruefen(
    formData,
    bekannte.map((terpen) => terpen.name),
  );
  if (!geprueft.ok) return { ok: false, fehler: text(w, sprache, geprueft.fehler) };
  const e = geprueft.wert;
  const kultivar = await prisma.kultivar.findUnique({
    where: { id: e.kultivarId },
    select: { id: true, name: true, slug: true, strains: { select: { id: true, slug: true, vertreiberId: true, handelsname: true, aktiv: true } } },
  });
  if (!kultivar) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.sorteWeg" }) };
  let ware = waehleWare(kultivar.strains, e.vertreiberId, e.strainId);
  if (!ware.ok && ware.grund === "vertreiberFremd" && !e.strainId && kultivar.slug) {
    // Alle Vertreiber sind wählbar (Nutzer 2026-10-22): führt dieser den Strain nicht gelistet,
    // trägt ein inaktiver Platzhalter die Bewertung. Nur echte Vertreiber (mit gelistetem Produkt).
    const platz = await platzhalterAnlegen(kultivar.id, kultivar.name, kultivar.slug, e.vertreiberId);
    if (platz) {
      kultivar.strains.push(platz);
      ware = waehleWare(kultivar.strains, e.vertreiberId, null);
    }
  }
  if (!ware.ok) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.wareFremd" }) };
  if (e.instagramReelUrl && !istBetreiber) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.reelNurBetreiber" }) };

  // Eine Bewertung je Mitglied, Sorte und Vertreiber (Spec 2026-10-15). Aus der Zeit "eine je Produkt" kann
  // ein Mitglied mehrere beim selben Vertreiber haben; welche überschrieben wird, entscheidet waehleZielBewertung.
  const kandidaten = await prisma.review.findMany({
    where: {
      autorId: mitglied.mitgliedId,
      OR: [{ kultivarId: kultivar.id, vertreiberId: e.vertreiberId }, { strainId: ware.strainId }],
    },
    select: { id: true, strainId: true, wareGenau: true },
  });
  const produkteBeimVertreiber = kultivar.strains.filter((s) => s.vertreiberId === e.vertreiberId && (s.aktiv || s.id === ware.strainId)).map((s) => s.id);
  const ziel = waehleZielBewertung(kandidaten, ware, e.strainId !== null, produkteBeimVertreiber);
  const produktSlug = kultivar.strains.find((s) => s.id === ziel.strainId)?.slug ?? null;

  // Charge: vorhandene nehmen, sonst anlegen. Ohne Nummer bleibt die Bewertung ohne Charge.
  let chargeId: string | null = null;
  if (e.chargenNr) {
    const charge = await prisma.charge.upsert({
      where: { strainId_chargenNr: { strainId: ziel.strainId, chargenNr: e.chargenNr } },
      create: { strainId: ziel.strainId, chargenNr: e.chargenNr },
      update: {},
      select: { id: true },
    });
    chargeId = charge.id;
  }

  // Eine Bewertung je Mitglied und Sorte: erneutes Speichern ueberschreibt.
  const daten = {
    gesamtnote: e.gesamtnote,
    chargeId,
    istRedaktionell: mitglied.jury,
    freigegeben: istBetreiber,
    ...e.noten,
    feuchtigkeitProzent: e.feuchtigkeitProzent,
    geschmacksMatrix: JSON.stringify(e.geschmacksMatrix),
    terpenIntensitaet: Object.keys(e.terpenIntensitaet).length > 0 ? JSON.stringify(e.terpenIntensitaet) : null,
    beschaffenheit: Object.keys(e.beschaffenheit).length > 0 ? JSON.stringify(e.beschaffenheit) : null,
    notiz: e.notiz,
    instagramReelUrl: istBetreiber ? e.instagramReelUrl : null,
  };
  // Mini-Netz (Spec Profil 2.12): der echte Stand vor dem Speichern, auch wenn eine
  // ältere Bewertung bearbeitet wird. Ohne Stand wächst das Netz aus der Mitte.
  const vorher = await ladeProfil(mitglied.mitgliedId).catch(() => null);
  const zuordnungDaten = { strainId: ziel.strainId, kultivarId: kultivar.id, vertreiberId: e.vertreiberId, wareGenau: ziel.wareGenau };
  let alteStrainId = ziel.alteStrainId;
  try {
    if (ziel.zielId) await prisma.review.update({ where: { id: ziel.zielId }, data: { ...daten, ...zuordnungDaten } });
    else await prisma.review.create({ data: { autorId: mitglied.mitgliedId, ...daten, ...zuordnungDaten } });
  } catch (fehler) {
    // Paralleles Speichern hat dazwischen eine Bewertung auf genau diesem Produkt angelegt: die nehmen.
    if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    await prisma.review.update({
      where: { autorId_strainId: { autorId: mitglied.mitgliedId, strainId: ziel.strainId } },
      data: { ...daten, ...zuordnungDaten },
    });
    alteStrainId = ziel.strainId;
  }
  await kennwerteFortschreiben(ziel.strainId);
  // Zieht die Bewertung auf ein anderes Produkt um, stimmen die Kennwerte des alten sonst nicht mehr.
  if (alteStrainId && alteStrainId !== ziel.strainId) await kennwerteFortschreiben(alteStrainId);
  // Empfehlungen und Profil (T11, Spec Profil 4.4) hier vorberechnen, nie je Seitenaufruf.
  // Ein Fehler darin soll die gespeicherte Bewertung nicht als gescheitert melden.
  let netz: { vorher: Geschmack | null; nachher: Geschmack; geformt: boolean } | null = null;
  try {
    await profilFortschreiben(mitglied.mitgliedId);
    const nachher = await ladeProfil(mitglied.mitgliedId);
    if (nachher) {
      netz = {
        vorher: vorher?.werte.geschmack ?? null,
        nachher: nachher.werte.geschmack,
        // Mittelfeld-Noten formen das Netz nicht: das Mini-Netz sagt dann etwas anderes als bei „kaum Veränderung“.
        geformt: netzGeformt(noteOderErsatz({ gesamtnote: e.gesamtnote, ...e.noten })),
      };
    }
  } catch (fehler) {
    console.error("profilFortschreiben/ladeProfil (Mini-Netz) fehlgeschlagen", fehler);
  }

  // Bis die Sortenseite auf den Kultivar-Slug umzieht (Task 4), lebt die Seite noch unter dem Produkt-Slug.
  if (kultivar.slug) revalidiereSprachen(`/blueten/${kultivar.slug}`);
  if (produktSlug) revalidiereSprachen(`/blueten/${produktSlug}`);
  revalidiereSprachen("/");
  await revalidiereKatalog();
  revalidiereSprachen("/reviews", "layout");
  revalidiereSprachen("/admin");
  revalidiereSprachen("/profil");
  return { ok: true, sofortSichtbar: istBetreiber, slug: kultivar.slug ?? produktSlug ?? "", strainId: ziel.strainId, netz };
}
