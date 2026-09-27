import type { Metadata } from "next";
import Link from "next/link";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Doppelseite } from "@/components/review/Doppelseite";
import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { redaktionelleReviews } from "@/lib/query/reviews";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank.
 * Anders als `/` und `/umfragen` ist diese Seite nicht nutzerbezogen - sie
 * ist der erste Kandidat fuer ISR, sobald die Cache-Bindings (KV, D1-Tags) stehen.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.reviews.titel, description: w.reviews.metaBeschreibung };
}

/** Das Buch selbst (Spec TP2 4.1): der neueste Eintrag gross, alle im Inhaltsverzeichnis. */
async function ReviewsInhalt() {
  const [reviews, w, sprache] = await Promise.all([redaktionelleReviews(), holeWoerterbuch(), holeSprache()]);

  if (reviews.length === 0) {
    return (
      <EmptyState
        titel={w.reviews.leerTitel}
        beschreibung={w.reviews.leerText}
        aktion={
          <Link href="/umfragen" className={buttonKlassen("secondary")}>
            {w.reviews.zurAbstimmung}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section aria-labelledby="neueste-titel" className="flex flex-col gap-8">
        <h2 id="neueste-titel" className={ABSCHNITT_TITEL}>
          {w.reviews.neuester}
        </h2>
        <Doppelseite eintrag={reviews[0]} umfang="auszug" ueberschrift="h3" w={w} sprache={sprache} />
      </section>

      {reviews.length > 1 ? (
        <section aria-labelledby="alle-titel" className="flex flex-col gap-8">
          <h2 id="alle-titel" className={ABSCHNITT_TITEL}>
            {w.reviews.alle}
          </h2>
          <Inhaltsverzeichnis eintraege={reviews} w={w} sprache={sprache} />
        </section>
      ) : null}
    </div>
  );
}

export default async function ReviewsPage() {
  const w = await holeWoerterbuch();
  return (
    <>
      <Seitenkopf
        titel={w.reviews.titel}
        satz={w.reviews.satz}
      />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        {/* Bewusst ohne Suspense-Grenze: der Inhalt steht im ersten HTML, damit er ohne JavaScript lesbar ist und Sprungziele (#eintrag-…) existieren. */}
        <ReviewsInhalt />
      </div>
    </>
  );
}
