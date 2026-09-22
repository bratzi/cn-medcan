import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, CardBody, EmptyState, Spinner } from "@/components/ui";
import { formatiereLieferzeit } from "@/lib/format";
import { rezeptStatusLabel } from "@/lib/labels";
import { ladeApothekenListe } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank,
 * ein statischer Render wuerde beim Build fehlschlagen. Entfaellt, sobald ISR
 * und die R2-Bindings stehen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apotheken",
  description:
    "Versandapotheken mit gemeldeten Beständen an verschreibungspflichtigen Cannabisarzneimitteln.",
};

const ZAHL_FORMAT = new Intl.NumberFormat("de-DE");

async function ApothekenListe() {
  const apotheken = await ladeApothekenListe();

  if (apotheken.length === 0) {
    return (
      <EmptyState
        titel="Keine Apotheken hinterlegt"
        beschreibung="Derzeit sind keine Apotheken im Katalog erfasst."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apotheken.map((apotheke) => (
        <li key={apotheke.id} className="flex">
          <Card className="w-full">
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="min-w-0 text-h3 text-text">
                  <Link
                    href={`/apotheken/${apotheke.slug}`}
                    className="rounded-sm transition-opacity duration-150 ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {apotheke.name}
                  </Link>
                </h2>
                <Badge variante={apotheke.versandapotheke ? "accent" : "neutral"}>
                  {apotheke.versandapotheke ? "Versandapotheke" : "Vor Ort"}
                </Badge>
              </div>

              <dl className="flex flex-col gap-2 text-small">
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">Ort</dt>
                  <dd className="text-text">
                    <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">Lieferzeit</dt>
                  <dd className="text-text">
                    {formatiereLieferzeit(
                      apotheke.lieferzeitTageMin,
                      apotheke.lieferzeitTageMax,
                    )}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">Rezept</dt>
                  <dd className="text-text">
                    {rezeptStatusLabel[apotheke.rezeptStatus]}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">Gelistete Produkte</dt>
                  <dd className="numeric text-text">
                    {ZAHL_FORMAT.format(apotheke.anzahlProdukte)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function ApothekenPage() {
  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <h1 className="text-h1 text-text">Apotheken</h1>
      <p className="mt-4 max-w-[68ch] text-body text-text-muted">
        Apotheken, die Bestände an verschreibungspflichtigen Cannabisarzneimitteln
        melden. Die Angaben zu Lieferzeit und Rezeptart stammen von der jeweiligen
        Apotheke.
      </p>

      <div className="mt-8">
        <Suspense fallback={<Spinner text="Apotheken werden geladen" />}>
          <ApothekenListe />
        </Suspense>
      </div>
    </div>
  );
}
