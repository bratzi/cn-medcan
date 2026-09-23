import type { Metadata } from "next";
import Link from "next/link";

import { UmfrageKarte, type StimmZustand } from "@/components/umfrage/UmfrageKarte";
import { VorschlagFormular } from "@/components/umfrage/VorschlagFormular";
import { Badge, Card, CardBody, CardHeader, EmptyState, buttonKlassen } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import {
  aktiveUmfrage,
  eigeneStimme,
  umfragenUebersicht,
  vorschlaegeLaden,
  type UmfrageUebersicht,
} from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";
import type { UmfragePhase } from "@/db/enums";

/** Nutzerbezogen (eigene Stimme, Freigabestatus) - siehe app/page.tsx. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abstimmungen",
  description:
    "Laufende und vergangene Runden: welche Sorte der Betreiber als Nächstes bewertet, bestimmen freigegebene Mitglieder.",
};

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung",
  BEENDET: "Beendet",
};

function RundenZeile({ runde }: { runde: UmfrageUebersicht }) {
  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-body font-medium text-text">{runde.titel}</span>
        <Badge variante={runde.istAktiv ? "accent" : "neutral"}>
          {PHASEN_LABEL[runde.phase]}
        </Badge>
      </div>

      <p className="mt-2 text-small text-text-muted">
        {`Start ${formatiereDatum(runde.startAm)}`}
        {runde.endetAm ? ` · Ende ${formatiereDatum(runde.endetAm)}` : null}
      </p>

      {runde.gewinner.length > 0 ? (
        <p className="mt-2 text-small text-text">
          <span className="font-medium">Ergebnis: </span>
          {runde.gewinner.map((g, index) => (
            <span key={g.slug}>
              {index > 0 ? ", " : null}
              <Link href={`/produkte/${g.slug}`} className="underline underline-offset-2">
                {g.handelsname}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </li>
  );
}

export default async function UmfragenPage() {
  const umfrage = await aktiveUmfrage();
  const mitglied = await aktuellesMitglied();

  let zustand: StimmZustand = { art: "ANONYM" };
  if (mitglied && !mitglied.freigegeben) {
    zustand = { art: "FREIGABE_OFFEN" };
  } else if (mitglied && umfrage) {
    const optionId = await eigeneStimme(umfrage.id, mitglied.mitgliedId);
    zustand = optionId ? { art: "ABGESTIMMT", optionId } : { art: "STIMMBERECHTIGT" };
  } else if (mitglied) {
    zustand = { art: "STIMMBERECHTIGT" };
  }

  // Das Vorschlagsformular braucht die Katalogliste. Sie wird nur geladen,
  // wenn sie auch angezeigt wird - sonst waere es eine Abfrage fuer nichts.
  const darfVorschlagen =
    umfrage?.phase === "VORSCHLAG" && mitglied?.freigegeben === true;

  const [vorschlaege, strains, runden] = await Promise.all([
    umfrage ? vorschlaegeLaden(umfrage.id) : Promise.resolve([]),
    darfVorschlagen ? ladeStrainAuswahl() : Promise.resolve([]),
    umfragenUebersicht(),
  ]);

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <section>
        <h1 className="max-w-[68ch] text-h1 text-text">Abstimmungen</h1>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Freigegebene Mitglieder schlagen Sorten vor und wählen daraus. Das Ergebnis einer
          Runde ist verbindlich für die nächste Bewertung des Betreibers.
        </p>

        <div className="mt-8">
          {umfrage ? (
            <UmfrageKarte umfrage={umfrage} zustand={zustand} />
          ) : (
            <EmptyState
              titel="Derzeit läuft keine Runde"
              beschreibung="Sobald die nächste Runde eröffnet ist, steht sie hier."
            />
          )}
        </div>
      </section>

      {umfrage ? (
        <section className="mt-10 sm:mt-16">
          <h2 className="text-h2 text-text">Vorschläge dieser Runde</h2>

          {darfVorschlagen ? (
            <Card className="mt-8">
              <CardHeader>
                <h3 className="text-h3 text-text">Sorte vorschlagen</h3>
              </CardHeader>
              <CardBody>
                <VorschlagFormular
                  umfrageId={umfrage.id}
                  strains={strains.map((s) => ({ wert: s.id, label: s.handelsname }))}
                />
              </CardBody>
            </Card>
          ) : null}

          {!mitglied && umfrage.phase === "VORSCHLAG" ? (
            <p className="mt-8 flex flex-wrap items-center gap-4 text-small text-text-muted">
              Vorschlagen können nur freigegebene Mitglieder.
              <Link
                href="/anmelden?weiter=%2Fumfragen"
                className={buttonKlassen("primary", "sm")}
              >
                Anmelden
              </Link>
            </p>
          ) : null}

          <div className="mt-8">
            {vorschlaege.length === 0 ? (
              <EmptyState
                titel="Noch keine Vorschläge"
                beschreibung="Für diese Runde liegt noch kein Vorschlag vor."
              />
            ) : (
              <ul className="flex flex-col">
                {vorschlaege.map((vorschlag) => (
                  <li
                    key={vorschlag.id}
                    className="border-t border-border py-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/produkte/${vorschlag.slug}`}
                        className="text-body font-medium text-text underline underline-offset-2"
                        title={vorschlag.handelsname}
                      >
                        {vorschlag.handelsname}
                      </Link>
                      {vorschlag.uebernommen ? (
                        <Badge variante="success">Auf der Wahlliste</Badge>
                      ) : (
                        <Badge variante="neutral">Offen</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-small text-text-muted">
                      {`Von ${vorschlag.vonAnzeigename} · ${formatiereDatum(vorschlag.erstelltAm)}`}
                    </p>
                    {vorschlag.begruendung ? (
                      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
                        {vorschlag.begruendung}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Alle Runden</h2>
        <div className="mt-8">
          {runden.length === 0 ? (
            <EmptyState
              titel="Noch keine Runden"
              beschreibung="Es wurde bisher keine Runde angelegt."
            />
          ) : (
            <ul className="flex flex-col">
              {runden.map((runde) => (
                <RundenZeile key={runde.id} runde={runde} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
