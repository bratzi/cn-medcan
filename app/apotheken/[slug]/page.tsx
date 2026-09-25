import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import type { BadgeVariante } from "@/components/ui";
import type { BestandStatus } from "@/db/enums";
import {
  formatiereGramm,
  formatiereLieferzeit,
  formatierePreisProGramm,
  formatiereRelativ,
} from "@/lib/format";
import { bestandStatusLabel, rezeptStatusLabel } from "@/lib/labels";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeApothekeDetail, type ApothekeDetail } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank,
 * ein statischer Render wuerde beim Build fehlschlagen. Entfaellt, sobald ISR
 * und die Cache-Bindings (KV, D1-Tags) stehen.
 */
export const dynamic = "force-dynamic";

const STATUS_VARIANTE: Record<BestandStatus, BadgeVariante> = {
  VERFUEGBAR: "success",
  NACHBESTELLT: "warning",
  NICHT_LIEFERBAR: "danger",
  AUSGELISTET: "neutral",
};

function statusLabel(status: string): string {
  return bestandStatusLabel[status as BestandStatus] ?? status;
}

function statusVariante(status: string): BadgeVariante {
  return STATUS_VARIANTE[status as BestandStatus] ?? "neutral";
}

export async function generateMetadata({
  params,
}: PageProps<"/apotheken/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const apotheke = await ladeApothekeDetail(slug, false);

  if (!apotheke) {
    return { title: "Apotheke nicht gefunden" };
  }

  return {
    title: apotheke.name,
    description: `Standort, Lieferzeit, Rezeptarten und gemeldetes Sortiment der ${apotheke.name}.`,
  };
}

function Stammdaten({ apotheke }: { apotheke: ApothekeDetail }) {
  const zeilen: { begriff: string; wert: ReactNode }[] = [
    { begriff: "Name", wert: apotheke.name },
    { begriff: "Anschrift", wert: apotheke.strasse ?? "k. A." },
    {
      begriff: "PLZ und Ort",
      wert: (
        <>
          <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
        </>
      ),
    },
    {
      begriff: "Telefon",
      wert: apotheke.telefon ? (
        <a
          href={`tel:${apotheke.telefon.replace(/\s+/g, "")}`}
          className="text-accent underline underline-offset-2 hover:opacity-70"
        >
          {apotheke.telefon}
        </a>
      ) : (
        "k. A."
      ),
    },
    {
      begriff: "E-Mail",
      wert: apotheke.email ? (
        <a
          href={`mailto:${apotheke.email}`}
          className="break-all text-accent underline underline-offset-2 hover:opacity-70"
        >
          {apotheke.email}
        </a>
      ) : (
        "k. A."
      ),
    },
    {
      begriff: "Website",
      wert: apotheke.website ? (
        <a
          href={apotheke.website}
          rel="noopener noreferrer"
          target="_blank"
          className="break-all text-accent underline underline-offset-2 hover:opacity-70"
        >
          {apotheke.website}
        </a>
      ) : (
        "k. A."
      ),
    },
    {
      begriff: "Lieferzeit",
      wert: formatiereLieferzeit(
        apotheke.lieferzeitTageMin,
        apotheke.lieferzeitTageMax,
      ),
    },
    { begriff: "Rezeptstatus", wert: rezeptStatusLabel[apotheke.rezeptStatus] },
    {
      begriff: "E-Rezept-Token per Upload",
      wert: apotheke.eRezeptTokenUpload ? "Wird angenommen" : "Wird nicht angenommen",
    },
    {
      begriff: "Betriebserlaubnisnummer",
      wert: apotheke.betriebserlaubnisNr ? (
        <span className="numeric">{apotheke.betriebserlaubnisNr}</span>
      ) : (
        "k. A."
      ),
    },
  ];

  return (
    <Card>
      <CardBody>
        <h2 className="text-h3 text-text">Stammdaten</h2>
        <dl className="mt-4 flex flex-col gap-4">
          {zeilen.map((zeile) => (
            <div
              key={zeile.begriff}
              className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:gap-8"
            >
              <dt className="text-small text-text-muted sm:w-64 sm:shrink-0">
                {zeile.begriff}
              </dt>
              <dd className="min-w-0 text-body text-text">{zeile.wert}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}

function Sortiment({
  apotheke,
  fachkreis,
}: {
  apotheke: ApothekeDetail;
  fachkreis: boolean;
}) {
  if (apotheke.sortiment.length === 0) {
    return (
      <EmptyState
        titel="Keine gelisteten Blüten"
        beschreibung="Diese Apotheke hat derzeit keine Bestände gemeldet."
      />
    );
  }

  return (
    <>
      {fachkreis ? null : (
        <p className="mb-4 max-w-[68ch] rounded-md border border-border bg-surface-raised px-4 py-4 text-small text-text-muted">
          Preise verschreibungspflichtiger Arzneimittel werden nach § 10 HWG nur
          Fachkreisen angezeigt.
        </p>
      )}

      <Table
        caption={`Gemeldete Bestände der ${apotheke.name}`}
        captionVersteckt
      >
        <TableHead>
          <TableRow>
            <TableHeaderCell>Blüte</TableHeaderCell>
            <TableHeaderCell numerisch>Packungsgröße</TableHeaderCell>
            {fachkreis ? (
              <TableHeaderCell numerisch>Preis pro Gramm</TableHeaderCell>
            ) : null}
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Stand</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apotheke.sortiment.map((zeile) => (
            <TableRow key={zeile.id}>
              <TableCell>
                <Link
                  href={`/produkte/${zeile.strain.slug}`}
                  title={zeile.strain.handelsname}
                  className="rounded-sm text-accent underline underline-offset-2 transition-opacity duration-150 ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {zeile.strain.handelsname}
                </Link>
              </TableCell>
              <TableCell numerisch>{formatiereGramm(zeile.packungGramm)}</TableCell>
              {fachkreis ? (
                <TableCell numerisch>
                  {formatierePreisProGramm(zeile.preisProGrammCent)}
                </TableCell>
              ) : null}
              <TableCell>
                <Badge variante={statusVariante(zeile.status)}>
                  {statusLabel(zeile.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-small text-text-muted">
                  {formatiereRelativ(zeile.standAm)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

async function ApothekeInhalt({ slug }: { slug: string }) {
  const fachkreis = await istFachkreis();
  const apotheke = await ladeApothekeDetail(slug, fachkreis);

  if (!apotheke) {
    notFound();
  }

  return (
    <>
      <h1 className="text-h1 text-text">{apotheke.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variante={apotheke.versandapotheke ? "accent" : "neutral"}>
          {apotheke.versandapotheke ? "Versandapotheke" : "Vor Ort"}
        </Badge>
        <span className="text-small text-text-muted">
          <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
        </span>
      </div>

      <div className="mt-8">
        <Stammdaten apotheke={apotheke} />
      </div>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Gelistete Blüten</h2>
        <div className="mt-8">
          <Sortiment apotheke={apotheke} fachkreis={fachkreis} />
        </div>
      </section>
    </>
  );
}

export default async function ApothekeDetailPage({
  params,
}: PageProps<"/apotheken/[slug]">) {
  const { slug } = await params;

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <p className="mb-8 text-small">
        <Link
          href="/apotheken"
          className="rounded-sm text-accent underline underline-offset-2 hover:opacity-70"
        >
          Zurück zur Apothekenübersicht
        </Link>
      </p>

      <Suspense fallback={<Spinner text="Apotheke wird geladen" />}>
        <ApothekeInhalt slug={slug} />
      </Suspense>
    </div>
  );
}
