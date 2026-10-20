import { ErgebnisListe } from "@/components/admin/ErgebnisListe";
import type { SelectOption } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import { reviewAuswahlFuerStrains } from "@/lib/query/reviews";
import { beendeteRundenMitGewinnern } from "@/lib/query/umfragen";

/**
 * Die Ergebnisse beendeter Runden.
 *
 * Zwei Abfragen, nicht eine pro Platz: erst die Runden mit ihren Gewinnern,
 * dann in einem Zug die eigenen Bewertungen zu genau diesen Sorten.
 */
export async function ErgebnisBereich() {
  const runden = await beendeteRundenMitGewinnern();
  // Ohne beendete Runde gibt es hier nichts zu tun - dann steht die Karte
  // auch nicht leer da.
  if (runden.length === 0) return null;

  const strainIds = runden.flatMap((runde) =>
    runde.plaetze.map((platz) => platz.strainId),
  );
  const reviews = await reviewAuswahlFuerStrains(strainIds);

  const reviewsJeStrain = new Map<string, SelectOption[]>();
  for (const review of reviews) {
    const liste = reviewsJeStrain.get(review.strainId) ?? [];
    liste.push({
      wert: review.id,
      // Datum und Charge unterscheiden zwei Bewertungen derselben Sorte; der
      // Entwurfsvermerk verhindert, dass eine unveroeffentlichte Bewertung
      // versehentlich als Ergebnis gesetzt wird.
      label:
        `${formatiereDatum(review.erstelltAm)}` +
        (review.chargenNr ? ` · Charge ${review.chargenNr}` : "") +
        (review.freigegeben ? "" : " · Entwurf"),
    });
    reviewsJeStrain.set(review.strainId, liste);
  }

  return <ErgebnisListe runden={runden} reviewsJeStrain={reviewsJeStrain} />;
}
