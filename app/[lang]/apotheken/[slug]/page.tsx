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
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
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

function statusLabel(w: Woerterbuch, status: string): string {
  return w.label.bestandStatus[status as BestandStatus] ?? status;
}

function statusVariante(status: string): BadgeVariante {
  return STATUS_VARIANTE[status as BestandStatus] ?? "neutral";
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [apotheke, w] = await Promise.all([ladeApothekeDetail(slug, false), holeWoerterbuch()]);

  if (!apotheke) {
    return { title: w.apotheke.nichtGefunden };
  }

  return {
    title: apotheke.name,
    description: t(w.apotheke.detailBeschreibung, { name: apotheke.name }),
  };
}

function Stammdaten({ apotheke, w, sprache }: { apotheke: ApothekeDetail; w: Woerterbuch; sprache: Sprache }) {
  const x = w.apotheke;
  const ka = w.bluete.fakten.keineAngabe;
  const zeilen: { begriff: string; wert: ReactNode }[] = [
    { begriff: x.name, wert: apotheke.name },
    { begriff: x.anschrift, wert: apotheke.strasse ?? ka },
    {
      begriff: x.plzOrt,
      wert: (
        <>
          <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
        </>
      ),
    },
    {
      begriff: x.telefon,
      wert: apotheke.telefon ? (
        <a
          href={`tel:${apotheke.telefon.replace(/\s+/g, "")}`}
          className="text-accent underline underline-offset-2 hover:opacity-70"
        >
          {apotheke.telefon}
        </a>
      ) : (
        ka
      ),
    },
    {
      begriff: x.email,
      wert: apotheke.email ? (
        <a
          href={`mailto:${apotheke.email}`}
          className="break-all text-accent underline underline-offset-2 hover:opacity-70"
        >
          {apotheke.email}
        </a>
      ) : (
        ka
      ),
    },
    {
      begriff: x.website,
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
        ka
      ),
    },
    {
      begriff: x.lieferzeit,
      wert: formatiereLieferzeit(
        apotheke.lieferzeitTageMin,
        apotheke.lieferzeitTageMax,
        sprache,
      ),
    },
    { begriff: x.rezeptstatus, wert: w.label.rezeptStatus[apotheke.rezeptStatus] },
    {
      begriff: x.token,
      wert: apotheke.eRezeptTokenUpload ? x.angenommen : x.nichtAngenommen,
    },
    {
      begriff: x.betriebserlaubnis,
      wert: apotheke.betriebserlaubnisNr ? (
        <span className="numeric">{apotheke.betriebserlaubnisNr}</span>
      ) : (
        ka
      ),
    },
  ];

  return (
    <Card>
      <CardBody>
        <h2 className="text-h3 text-text">{x.stammdaten}</h2>
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
  w,
  sprache,
}: {
  apotheke: ApothekeDetail;
  fachkreis: boolean;
  w: Woerterbuch;
  sprache: Sprache;
}) {
  const x = w.apotheke;
  if (apotheke.sortiment.length === 0) {
    return (
      <EmptyState
        titel={x.keineBestaende}
        beschreibung={x.keineBestaendeText}
      />
    );
  }

  return (
    <>
      {fachkreis ? null : (
        <p className="mb-4 max-w-[68ch] rounded-md border border-border bg-surface-raised px-4 py-4 text-small text-text-muted">
          {x.preisHinweis}
        </p>
      )}

      <Table
        caption={t(x.bestaende, { name: apotheke.name })}
        captionVersteckt
      >
        <TableHead>
          <TableRow>
            <TableHeaderCell>{x.spalten.bluete}</TableHeaderCell>
            <TableHeaderCell numerisch>{x.spalten.packung}</TableHeaderCell>
            {fachkreis ? (
              <TableHeaderCell numerisch>{x.spalten.preis}</TableHeaderCell>
            ) : null}
            <TableHeaderCell>{x.spalten.status}</TableHeaderCell>
            <TableHeaderCell>{x.spalten.stand}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apotheke.sortiment.map((zeile) => (
            <TableRow key={zeile.id}>
              <TableCell>
                <Link prefetch={false}
                  href={`/blueten/${zeile.strain.slug}`}
                  title={zeile.strain.handelsname}
                  className="rounded-sm text-accent underline underline-offset-2 transition-opacity duration-150 ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {zeile.strain.handelsname}
                </Link>
              </TableCell>
              <TableCell numerisch>{formatiereGramm(zeile.packungGramm, sprache)}</TableCell>
              {fachkreis ? (
                <TableCell numerisch>
                  {formatierePreisProGramm(zeile.preisProGrammCent, sprache)}
                </TableCell>
              ) : null}
              <TableCell>
                <Badge variante={statusVariante(zeile.status)}>
                  {statusLabel(w, zeile.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-small text-text-muted">
                  {formatiereRelativ(zeile.standAm, undefined, sprache)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

async function ApothekeInhalt({ slug, w, sprache }: { slug: string; w: Woerterbuch; sprache: Sprache }) {
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
          {apotheke.versandapotheke ? w.apotheke.versand : w.apotheke.vorOrt}
        </Badge>
        <span className="text-small text-text-muted">
          <span className="numeric">{apotheke.plz}</span> {apotheke.ort}
        </span>
      </div>

      <div className="mt-8">
        <Stammdaten apotheke={apotheke} w={w} sprache={sprache} />
      </div>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">{w.apotheke.gelistet}</h2>
        <div className="mt-8">
          <Sortiment apotheke={apotheke} fachkreis={fachkreis} w={w} sprache={sprache} />
        </div>
      </section>
    </>
  );
}

export default async function ApothekeDetailPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <p className="mb-8 text-small">
        <Link prefetch={false}
          href="/apotheken"
          className="rounded-sm text-accent underline underline-offset-2 hover:opacity-70"
        >
          {w.apotheke.zurueck}
        </Link>
      </p>

      <Suspense fallback={<Spinner text={w.apotheke.laedtEine} />}>
        <ApothekeInhalt slug={slug} w={w} sprache={sprache} />
      </Suspense>
    </div>
  );
}
