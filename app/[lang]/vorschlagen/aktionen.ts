"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { MAX_OFFENE_VORSCHLAEGE, blueteVorschlagPruefen } from "@/lib/vorschlag-eingabe";
import { bilderZugelassen, vorschlagBilderPruefen } from "@/lib/vorschlag-bilder";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";

export type VorschlagErgebnis =
  | { ok: true }
  | {
      ok: false;
      fehler: string;
      vorhanden?: { slug: string; handelsname: string };
      /** Eigener offener oder entschiedener Vorschlag mit demselben Schluessel: Link auf Mein Konto. */
      schonVorgeschlagen?: true;
    };

/**
 * Eine fehlende Bluete vorschlagen. Jedes angemeldete Mitglied darf das,
 * auch vor der Freigabe des Kontos (Spec 4.1): geprueft wird erst beim
 * Betreiber. Identitaet aus lib/session.ts, nie aus dem Formular.
 */
export async function blueteVorschlagen(formData: FormData): Promise<VorschlagErgebnis> {
  const mitglied = await mitgliedErforderlich();
  const wb = await holeWoerterbuchAusAnfrage();

  const geprueft = blueteVorschlagPruefen(formData, await terpenNamen());
  if (!geprueft.ok) return { ok: false, fehler: meldungText(wb, geprueft.fehler) };
  const w = geprueft.wert;

  // Bilder (freiwillig): der Server prueft sie erneut, der Browser hat nur verkleinert.
  const bilder = await vorschlagBilderPruefen(formData.getAll("bild"));
  if (!bilder.ok) return { ok: false, fehler: meldungText(wb, bilder.fehler) };
  const gesperrt = bilderZugelassen(bilder.wert.length, mitglied.freigegeben);
  if (gesperrt) return { ok: false, fehler: meldungText(wb, gesperrt) };

  // Eine inaktive Bluete steht nicht im Katalog: kein Link ins Leere, der
  // Vorschlag geht durch, und die Freigabe schaltet sie wieder an.
  const vorhanden = await blueteVorhanden(w.schluessel, w.handelsname);
  if (vorhanden?.aktiv) {
    return {
      ok: false,
      fehler: wb.meldung["vorschlag.schonImKatalog"],
      vorhanden: { slug: vorhanden.slug, handelsname: vorhanden.handelsname },
    };
  }

  const prisma = await getPrisma();
  // Gezaehlt vor dem Schreiben, ohne Transaktion: ein sechster Vorschlag bei
  // gleichzeitigem Absenden ist harmlos. Die Doppelsperre steht im Unique-Index.
  const offen = await prisma.sortenVorschlag.count({
    where: { mitgliedId: mitglied.mitgliedId, status: "OFFEN" },
  });
  if (offen >= MAX_OFFENE_VORSCHLAEGE) {
    return {
      ok: false,
      fehler: meldungText(wb, { schluessel: "vorschlag.zuVieleOffen", parameter: { max: MAX_OFFENE_VORSCHLAEGE } }),
    };
  }

  try {
    const angelegt = await prisma.sortenVorschlag.create({
      data: {
        mitgliedId: mitglied.mitgliedId,
        handelsname: w.handelsname,
        schluessel: w.schluessel,
        hersteller: w.hersteller,
        kultivarName: w.kultivarName,
        kultivarTyp: w.kultivarTyp,
        thcProzent: w.thcProzent,
        cbdProzent: w.cbdProzent,
        terpene: w.terpene.length ? JSON.stringify(w.terpene) : null,
        quelle: w.quelle,
        notiz: w.notiz,
      },
      select: { id: true },
    });
    // Ein INSERT je Bild (BLOB als gebundener Parameter). Bricht es ab, steht der
    // Vorschlag ohne Bilder da: er selbst ist gueltig, das Mitglied kann ihn ergaenzen lassen.
    for (const bild of bilder.wert) {
      await prisma.sortenVorschlagBild.create({
        data: { vorschlagId: angelegt.id, daten: bild.daten, breite: bild.breite, hoehe: bild.hoehe },
      });
    }
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return {
        ok: false,
        fehler: wb.meldung["vorschlag.schonVorgeschlagen"],
        schonVorgeschlagen: true,
      };
    }
    throw fehler;
  }

  revalidatePath("/mitglied");
  revalidatePath("/admin");
  revalidatePath("/admin/vorschlaege");
  return { ok: true };
}
