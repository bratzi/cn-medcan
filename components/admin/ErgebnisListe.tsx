import Link from "next/link";

import { ErgebnisFormular } from "@/components/admin/ErgebnisFormular";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import type { BeendeteRunde } from "@/lib/query/umfragen";

type Props = {
  runden: readonly BeendeteRunde[];
  /** Auswahl je Sorte - aus einer Abfrage ueber alle Sorten aufgeteilt. */
  reviewsJeStrain: ReadonlyMap<string, readonly SelectOption[]>;
};

const LEER: readonly SelectOption[] = [];

const TITEL_ID = "ergebnisse-titel";

/**
 * Die Ergebnisse beendeter Runden mit ihren Bewertungen verknuepfen.
 *
 * Das ist der letzte Schritt der Schleife, die das Alleinstellungsmerkmal
 * ist: die Community waehlt eine Sorte, der Betreiber probiert sie, und die
 * Bewertung wird hier an den gewonnenen Platz gehaengt.
 */
export function ErgebnisListe({ runden, reviewsJeStrain }: Props) {
  const offen = runden.reduce(
    (summe, runde) =>
      summe + runde.plaetze.filter((platz) => !platz.ergebnisReviewId).length,
    0,
  );

  return (
    <section aria-labelledby={TITEL_ID}>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id={TITEL_ID} className="text-h3 text-text">
            Ergebnisse verknüpfen
          </h2>
          {offen > 0 ? (
            <Badge variante="warning">
              {offen} {offen === 1 ? "Platz ohne Bewertung" : "Plätze ohne Bewertung"}
            </Badge>
          ) : (
            <Badge variante="success">Alle Plätze bewertet</Badge>
          )}
        </CardHeader>

        <CardBody className="flex flex-col gap-8">
          {runden.map((runde) => (
            <section key={runde.id} aria-labelledby={`runde-${runde.id}`}>
              <h3 id={`runde-${runde.id}`} className="text-body font-medium text-text">
                {runde.titel}
              </h3>
              <p className="mt-2 text-small text-text-muted">
                {runde.endetAm ? `Beendet ${formatiereDatum(runde.endetAm)}` : "Beendet"}
              </p>

              {runde.plaetze.length === 0 ? (
                <p className="mt-4 max-w-[68ch] text-body text-text-muted">
                  Diese Runde hat keinen Gewinner — auf keinen der Kandidaten fiel eine
                  Stimme.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col">
                  {runde.plaetze.map((platz) => (
                    <li
                      key={platz.optionId}
                      className="border-t border-border py-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/produkte/${platz.slug}`}
                          className="text-body font-medium text-text underline underline-offset-2"
                          title={platz.handelsname}
                        >
                          {platz.handelsname}
                        </Link>
                        {platz.herkunft === "GESETZT" ? (
                          <Badge
                            variante="neutral"
                            title="Vom Betreiber gesetzt, nicht zur Wahl gestellt"
                          >
                            Gesetzter Platz
                          </Badge>
                        ) : null}
                        {platz.ergebnisReviewId ? (
                          <Badge variante="success">Bewertung verknüpft</Badge>
                        ) : (
                          <Badge variante="warning">Bewertung fehlt</Badge>
                        )}
                      </div>

                      <div className="mt-4">
                        <ErgebnisFormular
                          optionId={platz.optionId}
                          handelsname={platz.handelsname}
                          reviews={reviewsJeStrain.get(platz.strainId) ?? LEER}
                          ergebnisReviewId={platz.ergebnisReviewId}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </CardBody>
      </Card>
    </section>
  );
}
