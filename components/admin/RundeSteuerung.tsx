import Link from "next/link";

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { bluetenHref } from "@/lib/alte-adressen";
import { formatiereDatum } from "@/lib/format";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";
import type { UmfragePhase } from "@/db/enums";

const ZAHL = new Intl.NumberFormat("de-DE");

const TITEL_ID = "laufende-runde-titel";

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung läuft",
  BEENDET: "Beendet",
};

type Props = {
  umfrage: UmfrageAnsicht;
};

/**
 * Die laufende Runde als Arbeitsflaeche des Betreibers.
 *
 * Bewusst nicht `UmfrageKarte`: die zeigt die Runde einem Mitglied und
 * bietet das Abstimmen an. Hier steht dieselbe Runde als Vorgang - Phase
 * schalten, Plaetze vergeben. Zwei Aufgaben, zwei Ansichten; eine Karte mit
 * einem `istAdmin`-Schalter waere beides halb.
 *
 * Server Component: die Schreibformulare darunter sind die einzigen
 * Client-Teile.
 */
export function RundeSteuerung({ umfrage }: Props) {
  // Wie auf der Startseite: in der Vorschlagsphase gibt es fachlich keine
  // Stimmen. Eine Spalte voller Nullen wuerde behaupten, niemand habe
  // gewaehlt - dabei konnte noch niemand.
  const zeigeStimmen = umfrage.phase !== "VORSCHLAG";

  return (
    <section aria-labelledby={TITEL_ID}>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id={TITEL_ID} className="text-h3 text-text">
            Laufende Runde
          </h2>
          <Badge variante="accent">{PHASEN_LABEL[umfrage.phase]}</Badge>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          <div>
            <p className="max-w-[68ch] text-body font-medium text-text">{umfrage.titel}</p>
            {umfrage.beschreibung ? (
              <p className="mt-2 max-w-[68ch] text-body text-text-muted">
                {umfrage.beschreibung}
              </p>
            ) : null}
          </div>

          <p className="text-small text-text-muted">
            {`Start ${formatiereDatum(umfrage.startAm)}`}
            {zeigeStimmen
              ? ` · ${ZAHL.format(umfrage.stimmenGesamt)} ${
                  umfrage.stimmenGesamt === 1 ? "abgegebene Stimme" : "abgegebene Stimmen"
                }`
              : null}
          </p>

          {umfrage.optionen.length === 0 ? (
            <p className="max-w-[68ch] text-body text-text-muted">
              Noch keine Kandidaten. Vorschläge der Community erscheinen hier, sobald sie übernommen sind.
            </p>
          ) : (
            <Table caption="Kandidaten dieser Runde" captionVersteckt>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Strain</TableHeaderCell>
                  <TableHeaderCell>Herkunft</TableHeaderCell>
                  {zeigeStimmen ? (
                    <TableHeaderCell numerisch>Stimmen</TableHeaderCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {umfrage.optionen.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell>
                      <Link prefetch={false}
                        href={bluetenHref(option.slug, option.kultivarSlug)}
                        className="font-medium text-text underline underline-offset-2"
                        title={option.handelsname}
                      >
                        {option.handelsname}
                      </Link>
                    </TableCell>

                    <TableCell>
                      {option.herkunft === "GESETZT" ? (
                        <Badge
                          variante="neutral"
                          title="Vom Betreiber gesetzt, nicht zur Wahl gestellt"
                        >
                          Gesetzter Platz
                        </Badge>
                      ) : (
                        <Badge variante="neutral" zeichen={false}>
                          Zur Wahl
                        </Badge>
                      )}
                    </TableCell>

                    {zeigeStimmen ? (
                      <TableCell numerisch>
                        {/* `null` heisst "steht nicht zur Wahl" - nicht 0. */}
                        {option.stimmen === null ? (
                          <span
                            className="text-text-muted"
                            title="Steht nicht zur Wahl"
                          >
                            —
                          </span>
                        ) : (
                          ZAHL.format(option.stimmen)
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>

        <CardBody className="border-t border-border">
          <p className="max-w-[68ch] text-small text-text-muted">
            Die Runde läuft nach Kalender: Vorschläge bis zum 15., danach Abstimmung bis zum Monatsende. Der Wechsel
            geschieht automatisch, es gibt keinen Knopf dafür.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
