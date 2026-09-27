import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, CardBody, EmptyState, Spinner } from "@/components/ui";
import { formatiereLieferzeit, formatiereZahl } from "@/lib/format";
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { ladeApothekenListe } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank,
 * ein statischer Render wuerde beim Build fehlschlagen. Entfaellt, sobald ISR
 * und die Cache-Bindings (KV, D1-Tags) stehen.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.apotheke.titel, description: w.apotheke.metaBeschreibung };
}

async function ApothekenListe({ w, sprache }: { w: Woerterbuch; sprache: Sprache }) {
  const texte = w.apotheke;
  const apotheken = await ladeApothekenListe();

  if (apotheken.length === 0) {
    return (
      <EmptyState
        titel={texte.leerTitel}
        beschreibung={texte.leerText}
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
                  {apotheke.versandapotheke ? texte.versand : texte.vorOrt}
                </Badge>
              </div>

              <dl className="flex flex-col gap-2 text-small">
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">{texte.ort}</dt>
                  <dd className="text-text">
                    <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">{texte.lieferzeit}</dt>
                  <dd className="text-text">
                    {formatiereLieferzeit(
                      apotheke.lieferzeitTageMin,
                      apotheke.lieferzeitTageMax,
                      sprache,
                    )}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">{texte.rezept}</dt>
                  <dd className="text-text">
                    {w.label.rezeptStatus[apotheke.rezeptStatus]}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-text-muted">{texte.gelistet}</dt>
                  <dd className="numeric text-text">
                    {formatiereZahl(apotheke.anzahlProdukte, 0, sprache)}
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

export default async function ApothekenPage() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <h1 className="text-h1 text-text">{w.apotheke.titel}</h1>
      <p className="mt-4 max-w-[68ch] text-body text-text-muted">
        {w.apotheke.satz}
      </p>

      <div className="mt-8">
        <Suspense fallback={<Spinner text={w.apotheke.laedt} />}>
          <ApothekenListe w={w} sprache={sprache} />
        </Suspense>
      </div>
    </div>
  );
}
