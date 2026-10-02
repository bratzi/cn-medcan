"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { bewertungPruefen } from "@/lib/bewertung-eingabe";
import { kennwerteFortschreiben } from "@/lib/kennwerte";
import { empfehlungenFortschreiben } from "@/lib/query/empfehlungen";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";
import { holeSpracheAusAnfrage, holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { meldungText } from "@/lib/i18n/text";
import type { Meldung, Woerterbuch } from "@/lib/i18n/typen";
import type { BeschaffenheitsKey } from "@/lib/query/bewertung";
import type { GeschmacksKategorie } from "@/db/enums";

export type BewertungErgebnis = { ok: true; sofortSichtbar: boolean; slug: string } | { ok: false; fehler: string };

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
  const strain = await prisma.strain.findUnique({
    where: { id: String(formData.get("strainId") ?? "") },
    select: { id: true, slug: true, aktiv: true },
  });
  if (!strain || !strain.aktiv) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.sorteWeg" }) };

  // Alle bekannten Terpene: auch solche, die der Hersteller nicht angibt, die man aber schmeckt.
  const bekannte = await prisma.terpen.findMany({ select: { name: true } });
  const geprueft = bewertungPruefen(
    formData,
    bekannte.map((terpen) => terpen.name),
  );
  if (!geprueft.ok) return { ok: false, fehler: text(w, sprache, geprueft.fehler) };
  const e = geprueft.wert;
  if (e.instagramReelUrl && !istBetreiber) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.reelNurBetreiber" }) };

  // Charge: vorhandene nehmen, sonst anlegen. Ohne Nummer bleibt die Bewertung ohne Charge.
  let chargeId: string | null = null;
  if (e.chargenNr) {
    const charge = await prisma.charge.upsert({
      where: { strainId_chargenNr: { strainId: strain.id, chargenNr: e.chargenNr } },
      create: { strainId: strain.id, chargenNr: e.chargenNr },
      update: {},
      select: { id: true },
    });
    chargeId = charge.id;
  }

  // Eine Bewertung je Mitglied und Sorte: erneutes Speichern ueberschreibt.
  const daten = {
    gesamtnote: e.gesamtnote,
    chargeId,
    istRedaktionell: istBetreiber,
    freigegeben: istBetreiber,
    ...e.noten,
    feuchtigkeitProzent: e.feuchtigkeitProzent,
    geschmacksMatrix: JSON.stringify(e.geschmacksMatrix),
    terpenIntensitaet: Object.keys(e.terpenIntensitaet).length > 0 ? JSON.stringify(e.terpenIntensitaet) : null,
    beschaffenheit: Object.keys(e.beschaffenheit).length > 0 ? JSON.stringify(e.beschaffenheit) : null,
    notiz: e.notiz,
    instagramReelUrl: istBetreiber ? e.instagramReelUrl : null,
  };
  await prisma.review.upsert({
    where: { autorId_strainId: { autorId: mitglied.mitgliedId, strainId: strain.id } },
    create: { strainId: strain.id, autorId: mitglied.mitgliedId, ...daten },
    update: daten,
  });
  await kennwerteFortschreiben(strain.id);
  // Empfehlungen nach aehnlichem Aroma (T11) hier vorberechnen, nie je Seitenaufruf.
  // Ein Fehler darin soll die gespeicherte Bewertung nicht als gescheitert melden.
  try {
    await empfehlungenFortschreiben(mitglied.mitgliedId);
  } catch (fehler) {
    console.error("empfehlungenFortschreiben fehlgeschlagen", fehler);
  }

  revalidiereSprachen(`/blueten/${strain.slug}`);
  revalidiereSprachen("/");
  revalidiereSprachen("/admin");
  revalidiereSprachen("/mitglied");
  return { ok: true, sofortSichtbar: istBetreiber, slug: strain.slug };
}
