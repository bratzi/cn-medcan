"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { MAX_OFFENE_VORSCHLAEGE, blueteVorschlagPruefen } from "@/lib/vorschlag-eingabe";

export type VorschlagErgebnis =
  | { ok: true }
  | { ok: false; fehler: string; vorhanden?: { slug: string; handelsname: string } };

/**
 * Eine fehlende Bluete vorschlagen. Jedes angemeldete Mitglied darf das,
 * auch vor der Freigabe des Kontos (Spec 4.1): geprueft wird erst beim
 * Betreiber. Identitaet aus lib/session.ts, nie aus dem Formular.
 */
export async function blueteVorschlagen(formData: FormData): Promise<VorschlagErgebnis> {
  const mitglied = await mitgliedErforderlich();

  const geprueft = blueteVorschlagPruefen(formData, await terpenNamen());
  if (!geprueft.ok) return geprueft;
  const w = geprueft.wert;

  const vorhanden = await blueteVorhanden(w.schluessel, w.handelsname);
  if (vorhanden) {
    return {
      ok: false,
      fehler: "Diese Blüte steht schon im Katalog.",
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
      fehler: `Du hast schon ${MAX_OFFENE_VORSCHLAEGE} offene Vorschläge. Sobald wir sie geprüft haben, geht es weiter.`,
    };
  }

  try {
    await prisma.sortenVorschlag.create({
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
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: "Diese Blüte hast du schon vorgeschlagen. Den Stand siehst du unter Mein Konto." };
    }
    throw fehler;
  }

  revalidatePath("/mitglied");
  revalidatePath("/admin");
  return { ok: true };
}
