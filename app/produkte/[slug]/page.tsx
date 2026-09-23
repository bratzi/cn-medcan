import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BestandTabelle } from "@/components/produkt/BestandTabelle";
import { BewertungsListe } from "@/components/produkt/BewertungsListe";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { GlasHeader } from "@/components/produkt/GlasHeader";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { TerpenMap } from "@/components/produkt/TerpenMap";
import {
  Card,
  CardBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import type { Bestrahlung } from "@/db/enums";
import {
  formatiereDatum,
  formatiereGramm,
  formatiereProzent,
  formatiereProzentSpanne,
} from "@/lib/format";
import {
  bestrahlungLabel,
  darreichungsformLabel,
  kultivarTypLabel,
} from "@/lib/labels";
import {
  berechneGesamtnote,
  verdichteGeschmacksMatrix,
} from "@/lib/query/bewertung";
import { istFachkreis } from "@/lib/query/fachkreis";
import {
  ladeStrainDetail,
  type StrainDetail,
  type UnternehmenEintrag,
} from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine zur Buildzeit
 * erreichbare Datenbank - das D1-Binding existiert erst im Request. Entfaellt,
 * sobald ISR und die R2-Bindings stehen; dann gehoert hier
 * `generateStaticParams` hin, denn Produktstammdaten aendern sich selten
 * (siehe edge-stack-master, Caching-Kaskade Stufe 1).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/produkte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const strain = await ladeStrainDetail(slug, false);

  if (!strain) {
    return { title: "Produkt nicht gefunden" };
  }

  return {
    title: strain.handelsname,
    description: `Cannabinoid- und Terpenprofil, Chargen und gemeldete Apothekenbestände zu ${strain.handelsname}.`,
  };
}

function unternehmenWert(eintrag: UnternehmenEintrag): ReactNode {
  const name = eintrag.website ? (
    <a
      href={eintrag.website}
      rel="noopener noreferrer"
      target="_blank"
      className="break-all text-accent underline underline-offset-2 hover:opacity-70"
    >
      {eintrag.name}
    </a>
  ) : (
    eintrag.name
  );

  if (!eintrag.land) return name;

  return (
    <>
      {name} <span className="text-text-muted">({eintrag.land})</span>
    </>
  );
}

/**
 * Faktenblock. Bewusst ein `dl`: Begriff und Wert gehoeren paarweise zusammen -
 * das ist keine Tabelle (nur eine Spalte Werte) und keine blosse Liste.
 */
function Faktenblock({ strain }: { strain: StrainDetail }) {
  const zeilen: { begriff: string; wert: ReactNode }[] = [
    { begriff: "Handelsname", wert: strain.handelsname },
    { begriff: "Kultivar", wert: strain.kultivarName ?? "k. A." },
    { begriff: "Kultivartyp", wert: kultivarTypLabel[strain.kultivarTyp] },
    {
      begriff: "Darreichungsform",
      wert: darreichungsformLabel[strain.darreichungsform],
    },
    { begriff: "Genetik", wert: strain.genetik ?? "k. A." },
    {
      begriff: "PZN",
      wert: strain.pzn ? <span className="numeric">{strain.pzn}</span> : "k. A.",
    },
    {
      begriff: "Bestrahlung",
      wert:
        bestrahlungLabel[strain.bestrahlung as Bestrahlung] ?? strain.bestrahlung,
    },
    { begriff: "Anbauland", wert: strain.anbauland ?? "k. A." },
    {
      begriff: "Hersteller",
      wert: strain.hersteller ? unternehmenWert(strain.hersteller) : "k. A.",
    },
    {
      begriff: "Importeur",
      wert: strain.importeur ? unternehmenWert(strain.importeur) : "k. A.",
    },
    {
      begriff: "Verschreibungspflicht",
      wert: strain.verschreibungspflichtig
        ? "Verschreibungspflichtig"
        : "Nicht verschreibungspflichtig",
    },
    {
      begriff: "BfArM-Listung",
      wert: strain.bfarmGelistet ? "Gelistet" : "Nicht gelistet",
    },
  ];

  return (
    <Card>
      <CardBody>
        <h2 className="text-h3 text-text">Produktdaten</h2>
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

/**
 * Chargentabelle. Die gemessenen Werte einer Charge stehen bewusst neben der
 * deklarierten Spanne und werden nicht mit ihr verrechnet: zwei Chargen
 * desselben Handelsnamens koennen deutlich abweichen, und genau das ist die
 * Information.
 */
function Chargentabelle({ chargen }: { chargen: StrainDetail["chargen"] }) {
  if (chargen.length === 0) {
    return (
      <p className="text-body text-text-muted">
        Für dieses Produkt liegen keine Chargendaten vor.
      </p>
    );
  }

  return (
    <Table caption="Analysewerte je Charge" captionVersteckt>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Charge</TableHeaderCell>
          <TableHeaderCell numerisch>THC gemessen</TableHeaderCell>
          <TableHeaderCell numerisch>CBD gemessen</TableHeaderCell>
          <TableHeaderCell>Analysedatum</TableHeaderCell>
          <TableHeaderCell>Verfall</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {chargen.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>
              <span className="numeric">{charge.chargenNr}</span>
            </TableCell>
            <TableCell numerisch>{formatiereProzent(charge.thcIst)}</TableCell>
            <TableCell numerisch>{formatiereProzent(charge.cbdIst)}</TableCell>
            <TableCell>{formatiereDatum(charge.analysedatum)}</TableCell>
            <TableCell>{formatiereDatum(charge.verfallsdatum)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function ProduktInhalt({ slug }: { slug: string }) {
  const fachkreis = await istFachkreis();
  const strain = await ladeStrainDetail(slug, fachkreis);

  if (!strain) {
    notFound();
  }

  // Mittel der Gesamtnoten, nicht Mittel aller Einzelachsen: sonst wuerde eine
  // Bewertung mit ungewoehnlichen Ausreissern auf einer Achse anders wiegen als
  // eine andere. Geladen sind ohnehin nur freigegebene Bewertungen.
  const gesamtnote =
    strain.reviews.length > 0
      ? strain.reviews.reduce(
          (summe, review) => summe + berechneGesamtnote(review),
          0
        ) / strain.reviews.length
      : null;

  const geschmack = verdichteGeschmacksMatrix(strain.reviews);

  const packungsgroessen = [
    ...new Set(strain.bestaende.map((bestand) => bestand.packungGramm)),
  ].sort((a, b) => a - b);

  return (
    <>
      <GlasHeader
        handelsname={strain.handelsname}
        kultivarName={strain.kultivarName}
        kultivarTyp={strain.kultivarTyp}
        darreichungsform={strain.darreichungsform}
        anzahlApothekenVerfuegbar={strain.anzahlApothekenVerfuegbar}
        gesamtnote={gesamtnote}
        anzahlBewertungen={strain.reviews.length}
        herstellerBildPfad={strain.herstellerBildPfad}
      />

      {strain.beschreibung ? (
        <p className="mt-8 max-w-[68ch] text-body text-text">
          {strain.beschreibung}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Faktenblock strain={strain} />

        <div className="flex flex-col gap-8">
          <Card>
            <CardBody>
              <h2 className="text-h3 text-text">Deklarierte Wirkstoffspannen</h2>
              <CannabinoidBar
                className="mt-4"
                thcMin={strain.thcMinProzent}
                thcMax={strain.thcMaxProzent}
                cbdMin={strain.cbdMinProzent}
                cbdMax={strain.cbdMaxProzent}
              />
              <p className="mt-4 text-caption text-text-muted">
                Herstellerangabe:{" "}
                {formatiereProzentSpanne(
                  strain.thcMinProzent,
                  strain.thcMaxProzent
                )}{" "}
                THC,{" "}
                {formatiereProzentSpanne(
                  strain.cbdMinProzent,
                  strain.cbdMaxProzent
                )}{" "}
                CBD.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-h3 text-text">Terpenprofil</h2>
              <p className="mt-2 text-small text-text-muted">
                Rang 1 ist das dominante Terpen.
              </p>
              <TerpenChips className="mt-4" terpene={strain.terpene} />
            </CardBody>
          </Card>
        </div>
      </div>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Apothekenbestände</h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Von den Apotheken gemeldeter Stand, keine Verfügbarkeitszusage.
        </p>
        <div className="mt-8">
          <BestandTabelle bestaende={strain.bestaende} fachkreis={fachkreis} />
        </div>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Chargen</h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Gemessene Werte einzelner Chargen. Sie können innerhalb der
          zulässigen Toleranz von der deklarierten Spanne abweichen.
        </p>
        <div className="mt-8">
          <Chargentabelle chargen={strain.chargen} />
        </div>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Geschmacksprofil aus den Bewertungen</h2>
        <div className="mt-8">
          <TerpenMap
            matrix={geschmack.matrix}
            anzahlBewertungen={geschmack.anzahlBewertungen}
          />
        </div>
      </section>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-h2 text-text">Bewertungen</h2>
        <div className="mt-8">
          <BewertungsListe reviews={strain.reviews} />
        </div>
      </section>

      <p className="mt-10 text-caption text-text-muted sm:mt-16">
        Gemeldete Packungsgrößen:{" "}
        {packungsgroessen.length > 0
          ? packungsgroessen.map((gramm) => formatiereGramm(gramm)).join(", ")
          : "keine"}
        . Stand der Produktdaten: {formatiereDatum(strain.aktualisiertAm)}.
      </p>
    </>
  );
}

export default async function ProduktDetailPage({
  params,
}: PageProps<"/produkte/[slug]">) {
  const { slug } = await params;

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-8 sm:py-16">
      <p className="mb-8 text-small">
        <Link
          href="/produkte"
          className="rounded-sm text-accent underline underline-offset-2 hover:opacity-70"
        >
          Zurück zur Produktübersicht
        </Link>
      </p>

      <Suspense fallback={<Spinner text="Produkt wird geladen" />}>
        <ProduktInhalt slug={slug} />
      </Suspense>
    </div>
  );
}
