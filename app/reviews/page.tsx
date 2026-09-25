import type { Metadata } from "next";
import Link from "next/link";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Doppelseite } from "@/components/review/Doppelseite";
import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { redaktionelleReviews } from "@/lib/query/reviews";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank.
 * Anders als `/` und `/umfragen` ist diese Seite nicht nutzerbezogen - sie
 * ist der erste Kandidat fuer ISR, sobald die Cache-Bindings (KV, D1-Tags) stehen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bewertungen",
  description: "Meine Bewertungen nach festem Schema, jeweils an eine konkrete Charge gebunden.",
};

/** Das Buch selbst (Spec TP2 4.1): der neueste Eintrag gross, alle im Inhaltsverzeichnis. */
async function ReviewsInhalt() {
  const reviews = await redaktionelleReviews();

  if (reviews.length === 0) {
    return (
      <EmptyState
        titel="Das erste Kapitel wird gerade geschrieben."
        beschreibung="Welche Sorte ich zuerst teste, entscheidet die Abstimmung."
        aktion={
          <Link href="/umfragen" className={buttonKlassen("secondary")}>
            Zur Abstimmung
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section aria-labelledby="neueste-titel" className="flex flex-col gap-8">
        <h2 id="neueste-titel" className={ABSCHNITT_TITEL}>
          Der neueste Eintrag
        </h2>
        <Doppelseite eintrag={reviews[0]} umfang="auszug" ueberschrift="h3" />
      </section>

      {reviews.length > 1 ? (
        <section aria-labelledby="alle-titel" className="flex flex-col gap-8">
          <h2 id="alle-titel" className={ABSCHNITT_TITEL}>
            Alle Einträge
          </h2>
          <Inhaltsverzeichnis eintraege={reviews} />
        </section>
      ) : null}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <Seitenkopf
        titel="Bewertungen"
        satz="Jede Sorte teste ich nach demselben Schema und schreibe dazu, welche Charge es war."
      />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        {/* Bewusst ohne Suspense-Grenze: der Inhalt steht im ersten HTML, damit er ohne JavaScript lesbar ist und Sprungziele (#eintrag-…) existieren. */}
        <ReviewsInhalt />
      </div>
    </>
  );
}
