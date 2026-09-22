import { Suspense } from "react";
import Link from "next/link";

import { ProduktCard } from "@/components/produkt/ProduktCard";
import { Card, CardBody, EmptyState, Spinner, buttonKlassen } from "@/components/ui";
import { leererFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainListe } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank,
 * ein statischer Render wuerde beim Build fehlschlagen. Entfaellt, sobald ISR
 * und die R2-Bindings stehen.
 */
export const dynamic = "force-dynamic";

const ANZAHL_AKTUELLE = 6;

const FILTER_EINSTIEGE = [
  { href: "/produkte?typ=INDICA", text: "Indica" },
  { href: "/produkte?typ=SATIVA", text: "Sativa" },
  { href: "/produkte?geschmack=ZITRUS", text: "Geschmack Zitrus" },
  { href: "/produkte?nurVerfuegbar=1", text: "Nur verfügbare Produkte" },
] as const;

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
        <h1 className="max-w-[68ch] text-h1 text-text">
          Katalog verschreibungspflichtiger Cannabisarzneimittel
        </h1>
        <p className="mt-4 max-w-[68ch] text-body text-text-muted">
          Diese Seite listet in Deutschland verkehrsfähige Cannabisarzneimittel nach
          ihren BfArM-Handelsnamen — mit Kultivartyp, Darreichungsform,
          Cannabinoidgehalt, Terpenprofil und der bei Versandapotheken gemeldeten
          Verfügbarkeit.
        </p>

        <Card className="mt-8 border-warning">
          <CardBody>
            <h2 className="text-h3 text-text">Rechtlicher Hinweis</h2>
            <ul className="mt-4 flex max-w-[68ch] list-disc flex-col gap-2 pl-6 text-body text-text-muted">
              <li>
                Alle gelisteten Produkte sind verschreibungspflichtige Arzneimittel
                und nur auf ärztliche Verordnung erhältlich.
              </li>
              <li>
                Die Angaben ersetzen keine medizinische oder pharmazeutische
                Beratung.
              </li>
              <li>Über diese Seite werden keine Arzneimittel abgegeben.</li>
            </ul>
          </CardBody>
        </Card>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Aktuelle Produkte</h2>
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
          Einstiege in die Katalogliste. Alle Kriterien lassen sich dort
          kombinieren.
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
          Zu jeder gelisteten Apotheke sind Standort, Lieferzeit, akzeptierte
          Rezeptarten und das gemeldete Sortiment hinterlegt.
        </p>
        <p className="mt-8">
          <Link href="/apotheken" className={buttonKlassen("secondary", "md")}>
            Apotheken ansehen
          </Link>
        </p>
      </section>
    </div>
  );
}
