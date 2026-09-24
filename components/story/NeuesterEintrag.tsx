import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Doppelseite } from "@/components/review/Doppelseite";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui";
import { neuesteRedaktionelleReview, type RedaktionelleReview } from "@/lib/query/reviews";
import { Schlagwort } from "@/components/story/Schlagwort";

/** Lädt den Eintrag; leer und Fehler haben eigene Sätze (Spec 5.2). */
async function EintragInhalt() {
  let review: RedaktionelleReview | null;
  try {
    review = await neuesteRedaktionelleReview();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("neuesteRedaktionelleReview fehlgeschlagen", fehler);
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        Der neueste Eintrag lässt sich gerade nicht laden. Lade die Seite in ein paar Minuten neu, der Rest funktioniert weiter.
      </p>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-start gap-6 border border-border bg-surface-raised p-8 sm:p-12">
        <p className="font-buch text-kapitel text-text">Das erste Kapitel wird gerade geschrieben.</p>
        <p className="max-w-[48ch] text-body text-text-muted">
          Welche Sorte wir zuerst testen, entscheidet die Abstimmung.
        </p>
        <Link href="#abstimmung" className={buttonKlassen("secondary", "md")}>
          Zur Abstimmung
        </Link>
      </div>
    );
  }

  return <Doppelseite eintrag={review} umfang="auszug" ueberschrift="h3" story />;
}

/** Sektion 5 (Spec 5.1): der Höhepunkt der Story. */
export function NeuesterEintrag() {
  return (
    <section
      aria-labelledby="eintrag-titel"
      data-story="eintrag"
      className="relative isolate overflow-x-clip bg-surface-sunken px-4 py-24 sm:px-8 sm:py-32"
    >
      <Schlagwort satz="frisch probiert" ton="gruen" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="eintrag-titel" className="font-buch text-kapitel text-text">
          Der <em className="farbverlauf italic">neueste</em> Eintrag
        </h2>
        <Suspense fallback={<DoppelseitenSkelett />}>
          <EintragInhalt />
        </Suspense>
      </div>
    </section>
  );
}
