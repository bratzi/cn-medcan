import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Netzdiagramm } from "@/components/story/Netzdiagramm";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { neuesteRedaktionelleReview, type RedaktionelleReview } from "@/lib/query/reviews";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * "Wirkung" steht auf der Startseite nicht (Spec 2): groß gesetzt läse sie
 * sich öffentlich als Wirksamkeitsversprechen. Der vollständige Eintrag
 * zeigt alle fünf Noten.
 */
const STARTSEITEN_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

function Doppelseite({ review }: { review: RedaktionelleReview }) {
  return (
    <article
      aria-labelledby="eintrag-name"
      data-story="doppelseite"
      className="grid grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12 lg:border-r lg:border-border">
        <p className="text-small text-text-muted">
          <time dateTime={review.erstelltAm.toISOString()}>{formatiereDatum(review.erstelltAm)}</time>
          {review.chargenNr ? (
            <>
              {" · Charge "}
              <span className="numeric">{review.chargenNr}</span>
            </>
          ) : null}
        </p>

        <h3 id="eintrag-name" className="font-buch text-kapitel text-text wrap-break-word hyphens-auto">
          {review.handelsname}
        </h3>

        <dl className="grid grid-cols-2 gap-6">
          {STARTSEITEN_ACHSEN.map((achse) => (
            // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
            <div key={achse.key} className="flex flex-col gap-1">
              <dt className="text-small text-text-muted">{achse.label}</dt>
              <dd className="numeric text-h1 text-text">
                <span aria-hidden="true" data-zaehler="" data-ziel={review[achse.key]}>
                  {NOTE.format(review[achse.key])}
                </span>
                <span aria-hidden="true" className="text-h3 text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${NOTE.format(review[achse.key])} von 5`}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12">
        <Netzdiagramm matrix={review.geschmacksMatrix} />
        {review.notiz ? (
          <p className="line-clamp-3 max-w-[56ch] text-body text-text-muted">{review.notiz}</p>
        ) : null}
        <p className="mt-auto">
          <Link href={`/produkte/${review.slug}`} className={buttonKlassen("secondary", "md")}>
            Ganzen Eintrag lesen
          </Link>
        </p>
      </div>
    </article>
  );
}

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
        Der neueste Eintrag lässt sich gerade nicht laden. Der Rest der Seite funktioniert weiter.
      </p>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-start gap-6 border border-border bg-surface-raised p-8 sm:p-12">
        <p className="font-buch text-kapitel text-text">Das erste Kapitel wird gerade geschrieben.</p>
        <p className="max-w-[48ch] text-body text-text-muted">
          Welche Sorte ich zuerst teste, entscheidet die Abstimmung.
        </p>
        <Link href="#abstimmung" className={buttonKlassen("secondary", "md")}>
          Zur Abstimmung
        </Link>
      </div>
    );
  }

  return <Doppelseite review={review} />;
}

/** Sektion 5 (Spec 5.1): der Höhepunkt der Story. */
export function NeuesterEintrag() {
  return (
    <section
      aria-labelledby="eintrag-titel"
      data-story="eintrag"
      className="bg-surface-sunken px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="eintrag-titel" className="font-buch text-kapitel text-text">
          Der neueste Eintrag
        </h2>
        <Suspense fallback={<DoppelseitenSkelett />}>
          <EintragInhalt />
        </Suspense>
      </div>
    </section>
  );
}
