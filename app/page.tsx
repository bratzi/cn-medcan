import { Suspense } from "react";
import Link from "next/link";

import { ProduktCard } from "@/components/produkt/ProduktCard";
import { ReviewKarte } from "@/components/review/ReviewKarte";
import { UmfrageKarte, type StimmZustand } from "@/components/umfrage/UmfrageKarte";
import { Card, CardBody, EmptyState, Spinner, buttonKlassen } from "@/components/ui";
import { leererFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { neuesteRedaktionelleReview } from "@/lib/query/reviews";
import { ladeStrainListe } from "@/lib/query/strains";
import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank,
 * ein statischer Render wuerde beim Build fehlschlagen. Entfaellt, sobald ISR
 * und die R2-Bindings stehen.
 *
 * Unabhaengig davon ist diese Seite inzwischen nutzerbezogen - die eigene
 * Stimme darf nie gecacht werden. Was cachefaehig ist (Umfragezahlen,
 * Katalog), wird spaeter einzeln gecacht, nicht die Seite als Ganzes.
 */
export const dynamic = "force-dynamic";

const ANZAHL_AKTUELLE = 6;

const FILTER_EINSTIEGE = [
  { href: "/produkte?typ=INDICA", text: "Indica" },
  { href: "/produkte?typ=SATIVA", text: "Sativa" },
  { href: "/produkte?geschmack=ZITRUS", text: "Geschmack Zitrus" },
  { href: "/produkte?nurVerfuegbar=1", text: "Nur verfügbare Produkte" },
] as const;

/**
 * Die laufende Umfrage - das Kernelement der Seite.
 *
 * Der Stimmzustand entsteht hier und nur hier: die Komponente darunter zeigt
 * ihn an, entscheidet aber nichts. Ueber das Schreiben entscheidet erneut
 * `freigabeErforderlich()` in der Server Action.
 */
async function AktuelleUmfrage() {
  const umfrage = await aktiveUmfrage();
  if (!umfrage) {
    return (
      <EmptyState
        titel="Derzeit läuft keine Abstimmung"
        beschreibung="Sobald die nächste Runde eröffnet ist, steht sie hier."
      />
    );
  }

  const mitglied = await aktuellesMitglied();

  let zustand: StimmZustand;
  if (!mitglied) {
    zustand = { art: "ANONYM" };
  } else if (!mitglied.freigegeben) {
    zustand = { art: "FREIGABE_OFFEN" };
  } else {
    const optionId = await eigeneStimme(umfrage.id, mitglied.mitgliedId);
    zustand = optionId ? { art: "ABGESTIMMT", optionId } : { art: "STIMMBERECHTIGT" };
  }

  return <UmfrageKarte umfrage={umfrage} zustand={zustand} />;
}

/** Die neueste eigene Bewertung - der zentrale Anhaltspunkt der Seite. */
async function LetzteReview() {
  const review = await neuesteRedaktionelleReview();
  if (!review) {
    return (
      <EmptyState
        titel="Noch keine eigene Bewertung"
        beschreibung="Die erste Bewertung des Betreibers erscheint hier, sobald sie freigegeben ist."
      />
    );
  }

  return <ReviewKarte review={review} />;
}

async function AktuelleProdukte() {
  const fachkreis = await istFachkreis();
  const liste = await ladeStrainListe(leererFilter(), fachkreis);
  // Bewusst in TypeScript zugeschnitten statt mit einer eigenen Abfrage.
  const eintraege = liste.eintraege.slice(0, ANZAHL_AKTUELLE);

  if (eintraege.length === 0) {
    return (
      <EmptyState
        titel="Keine Produkte im Katalog"
        beschreibung="Derzeit sind keine Handelsnamen hinterlegt."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {eintraege.map((strain) => (
        <li key={strain.id} className="flex">
          <ProduktCard strain={strain} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export default function StartPage() {
  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <section>
        <h1 className="max-w-[68ch] text-display text-text">
          Die Community bestimmt, was als Nächstes bewertet wird
        </h1>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Freigegebene Mitglieder wählen die nächste Sorte. Der Betreiber probiert sie und
          schreibt die Bewertung nach einem festen Schema — gebunden an eine konkrete Charge.
          Der Katalog verkehrsfähiger Cannabisarzneimittel steht darunter.
        </p>

        {/*
          Zwei Spalten ab lg: links die laufende Runde, rechts die letzte
          Bewertung. Beide laden getrennt, damit die langsamere die schnellere
          nicht aufhaelt.
        */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
          <Suspense fallback={<Spinner text="Abstimmung wird geladen" />}>
            <AktuelleUmfrage />
          </Suspense>
          <Suspense fallback={<Spinner text="Bewertung wird geladen" />}>
            <LetzteReview />
          </Suspense>
        </div>

        <p className="mt-8 flex flex-wrap gap-2">
          <Link href="/umfragen" className={buttonKlassen("secondary", "md")}>
            Alle Abstimmungen
          </Link>
          <Link href="/reviews" className={buttonKlassen("secondary", "md")}>
            Alle Bewertungen
          </Link>
        </p>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Aktuelle Produkte</h2>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Verschreibungspflichtige Cannabisarzneimittel nach ihren BfArM-Handelsnamen — mit
          Kultivartyp, Darreichungsform, Cannabinoidgehalt, Terpenprofil und der bei
          Versandapotheken gemeldeten Verfügbarkeit.
        </p>
        <div className="mt-8">
          <Suspense fallback={<Spinner text="Produkte werden geladen" />}>
            <AktuelleProdukte />
          </Suspense>
        </div>
        <p className="mt-8">
          <Link href="/produkte" className={buttonKlassen("secondary", "md")}>
            Gesamten Katalog ansehen
          </Link>
        </p>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Vorbereitete Filter</h2>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Einstiege in die Katalogliste. Alle Kriterien lassen sich dort kombinieren.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2">
          {FILTER_EINSTIEGE.map((eintrag) => (
            <li key={eintrag.href}>
              <Link href={eintrag.href} className={buttonKlassen("secondary", "sm")}>
                {eintrag.text}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Versandapotheken</h2>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Zu jeder gelisteten Apotheke sind Standort, Lieferzeit, akzeptierte Rezeptarten und das
          gemeldete Sortiment hinterlegt.
        </p>
        <p className="mt-8">
          <Link href="/apotheken" className={buttonKlassen("secondary", "md")}>
            Apotheken ansehen
          </Link>
        </p>
      </section>

      <section className="mt-10 sm:mt-16">
        <Card className="border-warning">
          <CardBody>
            <h2 className="text-h3 text-text">Rechtlicher Hinweis</h2>
            <ul className="mt-4 flex max-w-[68ch] list-disc flex-col gap-2 pl-6 text-body text-text-muted">
              <li>
                Alle gelisteten Produkte sind verschreibungspflichtige Arzneimittel und nur auf
                ärztliche Verordnung erhältlich.
              </li>
              <li>Die Angaben ersetzen keine medizinische oder pharmazeutische Beratung.</li>
              <li>Über diese Seite werden keine Arzneimittel abgegeben.</li>
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
