import type { Metadata } from "next";
import Link from "next/link";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Avatar, Badge, Blatt, EmptyState, buttonKlassen, namenLinkKlassen, textLinkKlassen } from "@/components/ui";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { VorschlagFormular } from "@/components/umfrage/VorschlagFormular";
import { phasenLabel } from "@/components/umfrage/phasen";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { rundenZeitraum } from "@/components/umfrage/zeitraum";
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
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { nimmtVorschlaegeAn } from "@/lib/umfrage-eingabe";

/** Nutzerbezogen (eigene Stimme, Freischaltung) - siehe app/page.tsx. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.umfrage.titel, description: w.umfrage.metaBeschreibung };
}

/** Handschrift-Überschrift: kurz, Imperativ, in Kopierstift (Spec TP3 10). */
const HAND_TITEL = "font-hand text-notiz text-logo";

function RundenZeile({ runde, w, sprache }: { runde: UmfrageUebersicht; w: Woerterbuch; sprache: Sprache }) {
  return (
    <li className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="font-buch text-h2 font-medium text-text wrap-break-word">{runde.titel}</p>
        <p className="numeric text-small text-text-muted">{rundenZeitraum(runde.startAm, runde.endetAm, w.umfrage.zeitraum, sprache)}</p>
        {runde.gewinner.length > 0 ? (
          <p className="text-body text-text wrap-break-word">
            {`${w.umfrage.gewonnen} `}
            {runde.gewinner.map((gewinner, index) => (
              <span key={gewinner.slug}>
                {index > 0 ? ", " : null}
                <Link prefetch={false} href={`/blueten/${gewinner.slug}`} className={textLinkKlassen()}>
                  {gewinner.handelsname}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <div>
        <Badge variante={runde.istAktiv ? "accent" : "neutral"}>{phasenLabel(w, runde.phase)}</Badge>
      </div>
    </li>
  );
}

/**
 * Hier spricht die Community (Spec TP3 10): Überschriften von Hand,
 * Namen und Begründungen gedruckt. Der Stimmzustand entsteht wie auf der
 * Startseite ueber stimmZustand(); ueber das Schreiben entscheidet die
 * Server Action erneut.
 */
async function UmfragenInhalt({ w, sprache }: { w: Woerterbuch; sprache: Sprache }) {
  const texte = w.umfrage;
  const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
  const optionId = umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
  const zustand = stimmZustand(mitglied, optionId);

  // Das Vorschlagsformular braucht die Katalogliste. Sie wird nur geladen,
  // wenn sie auch angezeigt wird - sonst waere es eine Abfrage fuer nichts.
  const darfVorschlagen = !!umfrage && nimmtVorschlaegeAn(umfrage) && mitglied?.freigegeben === true;

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
            <h2 id="runde-titel" className={cn(HAND_TITEL, "self-start max-md:self-center")}>
              {umfrage.phase === "VORSCHLAG" ? texte.schlagVor : texte.stimmAb}
            </h2>
            <UmfrageKarte umfrage={umfrage} zustand={zustand} ort="umfragen" w={w} sprache={sprache} />
          </>
        ) : (
          <>
            <h2 id="runde-titel" className="sr-only">
              {texte.laufendeRunde}
            </h2>
            <EmptyState
              titel={texte.keineRunde}
              beschreibung={texte.keineRundeText}
            />
          </>
        )}
      </section>

      {umfrage ? (
        <section id="vorschlaege" aria-labelledby="vorschlaege-titel" className="flex scroll-mt-8 flex-col gap-8">
          <h2 id="vorschlaege-titel" className={cn(HAND_TITEL, "self-start max-md:self-center")}>
            {texte.eureVorschlaege}
          </h2>

          {darfVorschlagen ? (
            <Blatt className="max-w-3xl text-left max-md:mx-auto">
              <h3 className="text-h3 text-text">{texte.deinVorschlag}</h3>
              <div className="mt-6">
                <VorschlagFormular
                  umfrageId={umfrage.id}
                  strains={strains.map((strain) => ({ wert: strain.id, label: strain.handelsname }))}
                  texte={texte.vorschlagFormular}
                />
              </div>
            </Blatt>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && !mitglied ? (
            <div className="flex flex-wrap items-center gap-4 max-md:justify-center">
              <p className="text-body text-text-muted">
                {texte.vorschlagenAnonym}
              </p>
              <Link prefetch={false} href="/anmelden?weiter=%2Fumfragen" className={buttonKlassen("primary")}>
                {texte.anmelden}
              </Link>
            </div>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && mitglied && !mitglied.freigegeben ? (
            <p className="text-body text-text-muted">{texte.vorschlagenFreigabe}</p>
          ) : null}

          {vorschlaege.length === 0 ? (
            <p className="text-body text-text-muted">{texte.keinVorschlag}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {vorschlaege.map((vorschlag) => (
                <li key={vorschlag.id} className="flex flex-col gap-2 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-4 max-md:justify-center">
                    <Link prefetch={false}
                      href={`/blueten/${vorschlag.slug}`}
                      className={namenLinkKlassen("min-w-0 font-buch text-h2 font-medium wrap-break-word")}
                    >
                      {vorschlag.handelsname}
                    </Link>
                    {vorschlag.uebernommen ? (
                      <Badge variante="success">{texte.aufWahlliste}</Badge>
                    ) : (
                      <Badge variante="neutral">{texte.offen}</Badge>
                    )}
                  </div>
                  <p className="flex items-center gap-2 text-small text-text-muted max-md:justify-center">
                    <Avatar name={vorschlag.vonAnzeigename} bildId={vorschlag.vonAvatarId} groesse="sm" />
                    {t(texte.von, { name: vorschlag.vonAnzeigename, datum: formatiereDatum(vorschlag.erstelltAm, sprache) })}
                  </p>
                  {vorschlag.begruendung ? (
                    <p className="max-w-[68ch] text-body text-text max-md:mx-auto">{vorschlag.begruendung}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="runden-titel" className="flex flex-col gap-8">
        <h2 id="runden-titel" className={ABSCHNITT_TITEL}>
          {texte.alleRunden}
        </h2>
        {runden.length === 0 ? (
          <EmptyState titel={texte.keineRunden} beschreibung={texte.keineRundenText} />
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {runden.map((runde) => (
              <RundenZeile key={runde.id} runde={runde} w={w} sprache={sprache} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export default async function UmfragenPage() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return (
    <>
      <Seitenkopf titel={w.umfrage.titel} satz={w.umfrage.satz} />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 max-md:text-center sm:pt-16")}>
        {/* Bewusst ohne Suspense-Grenze: der Inhalt steht im ersten HTML, damit er ohne JavaScript lesbar ist und Sprungziele (#eintrag-…) existieren. */}
        <UmfragenInhalt w={w} sprache={sprache} />
      </div>
    </>
  );
}
