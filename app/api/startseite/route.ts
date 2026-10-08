import { NextResponse } from "next/server";

import { begruendungText } from "@/lib/empfehlung-text";
import { holeSpracheAusAnfrage } from "@/lib/i18n/anfrage";
import { WOERTERBUECHER } from "@/lib/i18n/woerterbuecher";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeEigenesKapitel } from "@/lib/query/kapitel-start";
import { aktiveUmfrageId, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";
import { sitzungsAntwort } from "@/lib/startseite-sitzung";

const PRIVAT = { "Cache-Control": "private, no-store" };

/**
 * Die nutzerbezogenen Teile der statischen Startseite in einem Aufruf (Spec
 * 2026-10-01, statische Seiten, 4.3): Stimmzustand zur laufenden Runde, eigene
 * Empfehlungen mit Begründung in der Sprache der Anfrage, Budpic-Zugang, das eigene Kapitel. Gäste
 * bekommen ihre Antwort ohne Datenbank. Ein Fehler endet als 500; die Inseln
 * zeigen dann ihre Fehlertexte.
 */
export async function GET() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) {
    return NextResponse.json(
      sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] }),
      { headers: PRIVAT },
    );
  }

  const sprache = await holeSpracheAusAnfrage();
  const w = WOERTERBUECHER[sprache];
  const [umfrageId, liste, kapitel] = await Promise.all([
    aktiveUmfrageId(),
    ladeEmpfehlungen(mitglied.mitgliedId),
    // Kein Pflichtinhalt (Spec 4.3): scheitert das Kapitel, bleibt das Schaufenster, der Rest läuft weiter.
    ladeEigenesKapitel(mitglied.mitgliedId).catch((fehler: unknown) => {
      console.error("ladeEigenesKapitel fehlgeschlagen", fehler);
      return null;
    }),
  ]);
  const eigeneOptionId =
    umfrageId && mitglied.freigegeben ? await eigeneStimme(umfrageId, mitglied.mitgliedId) : null;

  return NextResponse.json(
    sitzungsAntwort({
      mitglied,
      umfrageId,
      eigeneOptionId,
      kapitel,
      empfehlungen: liste.map((e) => ({
        slug: e.slug,
        handelsname: e.handelsname,
        begruendung: begruendungText(e, w, sprache),
        // Aufgefüllte Sorten sichtbar markieren wie im Profil (Spec Profil 2.4).
        ...(e.bestaetigt ? {} : { marke: w.profil.nichtBestaetigt }),
      })),
    }),
    { headers: PRIVAT },
  );
}
