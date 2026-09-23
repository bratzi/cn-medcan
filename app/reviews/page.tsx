import type { Metadata } from "next";

import { ReviewKarte } from "@/components/review/ReviewKarte";
import { EmptyState } from "@/components/ui";
import { redaktionelleReviews } from "@/lib/query/reviews";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank.
 * Anders als `/` und `/umfragen` ist diese Seite nicht nutzerbezogen - sie
 * ist der erste Kandidat fuer ISR, sobald die R2-Bindings stehen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bewertungen",
  description:
    "Die Bewertungen des Betreibers nach festem Schema, jeweils gebunden an eine konkrete Charge.",
};

export default async function ReviewsPage() {
  const reviews = await redaktionelleReviews();

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <section>
        <h1 className="max-w-[68ch] text-h1 text-text">Bewertungen</h1>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Jede Bewertung folgt demselben Schema aus fünf Noten und der Restfeuchte und ist an
          eine konkrete Charge gebunden. Welche Sorte als Nächstes bewertet wird, entscheiden
          die Abstimmungen.
        </p>

        <div className="mt-8">
          {reviews.length === 0 ? (
            <EmptyState
              titel="Noch keine Bewertung"
              beschreibung="Die erste Bewertung erscheint hier, sobald sie freigegeben ist."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {reviews.map((review) => (
                <li key={review.id} className="flex">
                  <ReviewKarte review={review} className="w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
