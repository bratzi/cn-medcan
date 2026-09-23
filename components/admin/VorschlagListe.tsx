import Link from "next/link";

import { VorschlagUebernehmen } from "@/components/admin/VorschlagUebernehmen";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import type { VorschlagAnsicht } from "@/lib/query/umfragen";
import type { UmfragePhase } from "@/db/enums";

const TITEL_ID = "vorschlaege-titel";

type Props = {
  vorschlaege: readonly VorschlagAnsicht[];
  phase: UmfragePhase;
};

/**
 * Die Vorschlaege der laufenden Runde mit der Entscheidung daran.
 *
 * Die Reihenfolge kommt aus `vorschlaegeLaden`: offene zuerst - das ist die
 * Arbeit, die ansteht.
 */
export function VorschlagListe({ vorschlaege, phase }: Props) {
  const offen = vorschlaege.filter((vorschlag) => !vorschlag.uebernommen).length;

  return (
    <section aria-labelledby={TITEL_ID}>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id={TITEL_ID} className="text-h3 text-text">
            Vorschläge dieser Runde
          </h2>
          {offen > 0 ? (
            <Badge variante="warning">
              {offen} {offen === 1 ? "offener Vorschlag" : "offene Vorschläge"}
            </Badge>
          ) : (
            <Badge variante="neutral" zeichen={false}>
              Kein offener Vorschlag
            </Badge>
          )}
        </CardHeader>

        <CardBody>
          {vorschlaege.length === 0 ? (
            <p className="max-w-[68ch] text-body text-text-muted">
              Für diese Runde liegt noch kein Vorschlag vor. Vorschlagen können nur
              freigegebene Mitglieder, und nur in der Vorschlagsphase.
            </p>
          ) : (
            <ul className="flex flex-col">
              {vorschlaege.map((vorschlag) => (
                <li
                  key={vorschlag.id}
                  className="border-t border-border py-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/produkte/${vorschlag.slug}`}
                        className="text-body font-medium text-text underline underline-offset-2"
                        title={vorschlag.handelsname}
                      >
                        {vorschlag.handelsname}
                      </Link>
                      <p className="mt-2 text-small text-text-muted">
                        {`Von ${vorschlag.vonAnzeigename} · ${formatiereDatum(vorschlag.erstelltAm)}`}
                      </p>
                      {vorschlag.begruendung ? (
                        <p className="mt-2 max-w-[68ch] text-body text-text-muted">
                          {vorschlag.begruendung}
                        </p>
                      ) : null}
                    </div>

                    {vorschlag.uebernommen ? (
                      <Badge variante="success">Auf der Wahlliste</Badge>
                    ) : phase === "BEENDET" ? (
                      // Die Aktion weist es ohnehin ab; hier steht der Grund.
                      <span className="text-small text-text-muted">Runde beendet</span>
                    ) : (
                      <VorschlagUebernehmen
                        vorschlagId={vorschlag.id}
                        handelsname={vorschlag.handelsname}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
