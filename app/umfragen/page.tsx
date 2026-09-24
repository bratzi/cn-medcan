import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Textur } from "@/components/medien/Textur";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { Badge, Blatt, EmptyState, buttonKlassen, namenLinkKlassen, textLinkKlassen } from "@/components/ui";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { VorschlagFormular } from "@/components/umfrage/VorschlagFormular";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { rundenZeitraum } from "@/components/umfrage/zeitraum";
import type { UmfragePhase } from "@/db/enums";
import { cn } from "@/lib/cn";
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

/** Nutzerbezogen (eigene Stimme, Freischaltung) - siehe app/page.tsx. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abstimmung",
  description: "Laufende und vergangene Runden: Ihr schlagt Sorten vor und wählt, was ich als Nächstes teste.",
};

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung",
  BEENDET: "Beendet",
};

/** Wand-Ueberschrift: kurz, Imperativ, in Sprühviolett (Guideline 8). */
const WAND_TITEL = "font-wand text-tag text-spray";

function RundenZeile({ runde }: { runde: UmfrageUebersicht }) {
  return (
    <li className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="font-buch text-h2 font-medium text-text wrap-break-word">{runde.titel}</p>
        <p className="numeric text-small text-text-muted">{rundenZeitraum(runde.startAm, runde.endetAm)}</p>
        {runde.gewinner.length > 0 ? (
          <p className="text-body text-text">
            {"Gewonnen: "}
            {runde.gewinner.map((gewinner, index) => (
              <span key={gewinner.slug}>
                {index > 0 ? ", " : null}
                <Link href={`/produkte/${gewinner.slug}`} className={textLinkKlassen()}>
                  {gewinner.handelsname}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <div>
        <Badge variante={runde.istAktiv ? "accent" : "neutral"}>{PHASEN_LABEL[runde.phase]}</Badge>
      </div>
    </li>
  );
}

/**
 * Hier spricht die Wand (Spec TP2 4.2): Tags in Sedgwick, Namen und
 * Begruendungen im Buchstil. Der Stimmzustand entsteht wie auf der
 * Startseite ueber stimmZustand(); ueber das Schreiben entscheidet die
 * Server Action erneut.
 */
async function UmfragenInhalt() {
  const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
  const optionId = umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
  const zustand = stimmZustand(mitglied, optionId);

  // Das Vorschlagsformular braucht die Katalogliste. Sie wird nur geladen,
  // wenn sie auch angezeigt wird - sonst waere es eine Abfrage fuer nichts.
  const darfVorschlagen = umfrage?.phase === "VORSCHLAG" && mitglied?.freigegeben === true;

  const [vorschlaege, strains, runden] = await Promise.all([
    umfrage ? vorschlaegeLaden(umfrage.id) : Promise.resolve([]),
    darfVorschlagen ? ladeStrainAuswahl() : Promise.resolve([]),
    umfragenUebersicht(),
  ]);

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section aria-labelledby="runde-titel" className="flex flex-col gap-8">
        {umfrage ? (
          <>
            <h2 id="runde-titel" className={cn(WAND_TITEL, "-rotate-2 self-start")}>
              {umfrage.phase === "VORSCHLAG" ? "Schlag vor." : "Stimm ab."}
            </h2>
            <UmfrageKarte umfrage={umfrage} zustand={zustand} ort="umfragen" />
          </>
        ) : (
          <>
            <h2 id="runde-titel" className="sr-only">
              Laufende Runde
            </h2>
            <EmptyState
              titel="Gerade läuft keine Runde."
              beschreibung="Die nächste steht hier, sobald sie eröffnet ist."
            />
          </>
        )}
      </section>

      {umfrage ? (
        <section id="vorschlaege" aria-labelledby="vorschlaege-titel" className="flex scroll-mt-8 flex-col gap-8">
          <div className="relative isolate self-start">
            <Textur id="nebel" weich className="absolute -inset-x-8 -inset-y-4 -z-10 opacity-40" />
            <h2 id="vorschlaege-titel" className={cn(WAND_TITEL, "-rotate-1")}>
              Eure Vorschläge.
            </h2>
          </div>

          {darfVorschlagen ? (
            <Blatt className="max-w-3xl">
              <h3 className="text-h3 text-text">Dein Vorschlag</h3>
              <div className="mt-6">
                <VorschlagFormular
                  umfrageId={umfrage.id}
                  strains={strains.map((strain) => ({ wert: strain.id, label: strain.handelsname }))}
                />
              </div>
            </Blatt>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && !mitglied ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-body text-text-muted">
                Vorschlagen kannst du, sobald du angemeldet und freigeschaltet bist.
              </p>
              <Link href="/anmelden?weiter=%2Fumfragen" className={buttonKlassen("primary")}>
                Anmelden
              </Link>
            </div>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && mitglied && !mitglied.freigegeben ? (
            <p className="text-body text-text-muted">Sobald ich dein Konto freischalte, kannst du hier vorschlagen.</p>
          ) : null}

          {vorschlaege.length === 0 ? (
            <p className="text-body text-text-muted">Noch kein Vorschlag in dieser Runde.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {vorschlaege.map((vorschlag) => (
                <li key={vorschlag.id} className="flex flex-col gap-2 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <Link
                      href={`/produkte/${vorschlag.slug}`}
                      className={namenLinkKlassen("min-w-0 font-buch text-h2 font-medium wrap-break-word")}
                    >
                      {vorschlag.handelsname}
                    </Link>
                    {vorschlag.uebernommen ? (
                      <Badge variante="success">Auf der Wahlliste</Badge>
                    ) : (
                      <Badge variante="neutral">Offen</Badge>
                    )}
                  </div>
                  <p className="text-small text-text-muted">
                    {`Von ${vorschlag.vonAnzeigename}, ${formatiereDatum(vorschlag.erstelltAm)}`}
                  </p>
                  {vorschlag.begruendung ? (
                    <p className="max-w-[68ch] text-body text-text">{vorschlag.begruendung}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="runden-titel" className="flex flex-col gap-8">
        <h2 id="runden-titel" className={ABSCHNITT_TITEL}>
          Alle Runden
        </h2>
        {runden.length === 0 ? (
          <EmptyState titel="Noch keine Runden." beschreibung="Hier steht jede Runde, sobald die erste eröffnet ist." />
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {runden.map((runde) => (
              <RundenZeile key={runde.id} runde={runde} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export default function UmfragenPage() {
  return (
    <>
      <Seitenkopf titel="Abstimmung" satz="Ihr schlagt Sorten vor und wählt. Was gewinnt, teste ich als Nächstes." />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        <Suspense fallback={<StimmzettelSkelett />}>
          <UmfragenInhalt />
        </Suspense>
      </div>
    </>
  );
}
