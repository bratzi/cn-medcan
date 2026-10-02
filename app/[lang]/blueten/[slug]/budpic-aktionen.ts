"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE, BUDPIC_MAX_OFFEN } from "@/lib/budpics";
import { bildPruefen } from "@/lib/bild-pruefen";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";

export type BudpicErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Ein Bluetenbild beitragen (T9, Nutzer 2026-09-29). Der Browser hat es schon
 * auf hoechstens 1280 px und 150 KB als WebP verkleinert; darauf verlassen wir
 * uns nicht: der Server prueft Groesse (vor dem Lesen), dann Typ per Magic
 * Bytes, RIFF-Laenge und Masse erneut. Wer hochlaedt, kommt aus der Sitzung
 * (nur freigegebene Mitglieder), nie aus dem Formular. Das Bild startet OFFEN
 * und erscheint erst nach der Freigabe in /admin.
 *
 * Eine Datei je Aufruf: der Client schickt mehrere nacheinander, so bleibt
 * jede Anfrage klein und ein Fehler trifft nur diese Datei. Es ist ein einziges
 * INSERT, also atomar; ein Loeschen-und-Anlegen kaeme nicht vor.
 */
export async function budpicHochladen(formData: FormData): Promise<BudpicErgebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  const fehler = (schluessel: Parameters<typeof meldungText>[1]): BudpicErgebnis => ({ ok: false, fehler: meldungText(w, schluessel) });

  let mitglied;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return fehler({ schluessel: "budpic.nurFreigeschaltet" });
  }

  const datei = formData.get("bild");
  if (!(datei instanceof File) || datei.size === 0) return fehler({ schluessel: "bild.fehlt" });
  // Vor dem Einlesen ablehnen: ein grosser Body soll keinen Speicher kosten.
  if (datei.size > BUDPIC_MAX_BYTES) {
    return fehler({ schluessel: "bild.zuGross", parameter: { max: BUDPIC_MAX_BYTES / 1024 } });
  }
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const geprueft = bildPruefen(bytes, { maxBytes: BUDPIC_MAX_BYTES, maxBreite: BUDPIC_MAX_KANTE, maxHoehe: BUDPIC_MAX_KANTE });
  if (!geprueft.ok) return fehler(geprueft.fehler);

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: String(formData.get("strainId") ?? "") },
    select: { id: true, slug: true, aktiv: true },
  });
  if (!strain || !strain.aktiv) return fehler({ schluessel: "budpic.sorteUnbekannt" });

  const offen = await prisma.budpic.count({ where: { mitgliedId: mitglied.mitgliedId, status: "OFFEN" } });
  if (offen >= BUDPIC_MAX_OFFEN) return fehler({ schluessel: "budpic.zuVieleOffen", parameter: { max: BUDPIC_MAX_OFFEN } });

  await prisma.budpic.create({
    data: {
      strainId: strain.id,
      mitgliedId: mitglied.mitgliedId,
      daten: bytes,
      breite: geprueft.breite,
      hoehe: geprueft.hoehe,
    },
  });
  revalidiereSprachen("/admin");
  return { ok: true };
}
