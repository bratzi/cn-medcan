import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ABSCHNITT_TITEL, seitenRahmen } from "@/components/layout/Seitenkopf";
import { BestandTabelle } from "@/components/produkt/BestandTabelle";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Titelblatt } from "@/components/produkt/Titelblatt";
import { CommunityStimmen } from "@/components/review/CommunityStimmen";
import { Doppelseite } from "@/components/review/Doppelseite";
import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { Aufklaerung } from "@/components/review/Aufklaerung";
import { SweetSpot } from "@/components/review/SweetSpot";
import { herstellerProfil } from "@/lib/aromakarte";
import { alsEintrag } from "@/components/review/eintrag";
import {
  Faktenliste,
  buttonKlassen,
  einzelLinkKlassen,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  textLinkKlassen,
  type Fakt,
} from "@/components/ui";
import type { Bestrahlung } from "@/db/enums";
import { cn } from "@/lib/cn";
import {
  formatiereDatum,
  formatiereGramm,
  formatiereProzent,
  formatiereProzentSpanne,
} from "@/lib/format";
import { bestrahlungLabel, darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";
import { teileBewertungen, verdichteGeschmacksMatrix, mittleTerpenIntensitaet, parseTerpenIntensitaet } from "@/lib/query/bewertung";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainDetail, type StrainDetail, type UnternehmenEintrag } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine zur Buildzeit
 * erreichbare Datenbank - das D1-Binding existiert erst im Request. Entfaellt,
 * sobald ISR und die R2-Bindings stehen; dann gehoert hier
 * `generateStaticParams` hin (edge-stack-master, Caching-Kaskade Stufe 1).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/produkte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const strain = await ladeStrainDetail(slug, false);
  if (!strain) return { title: "Produkt nicht gefunden" };
  return {
    title: strain.handelsname,
    description: `Meine Bewertung, Cannabinoid- und Terpenprofil, Chargen und gemeldete Apothekenbestände zu ${strain.handelsname}.`,
  };
}

const ABSTAND = "mt-16 sm:mt-24";

function unternehmenWert(eintrag: UnternehmenEintrag): ReactNode {
  const name = eintrag.website ? (
    <a href={eintrag.website} rel="noopener noreferrer" target="_blank" className={textLinkKlassen("break-all")}>
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

function produktFakten(strain: StrainDetail): Fakt[] {
  return [
    { begriff: "Handelsname", wert: strain.handelsname },
    { begriff: "Kultivar", wert: strain.kultivarName ?? "k. A." },
    { begriff: "Kultivartyp", wert: kultivarTypLabel[strain.kultivarTyp] },
    { begriff: "Darreichungsform", wert: darreichungsformLabel[strain.darreichungsform] },
    { begriff: "Genetik", wert: strain.genetik ?? "k. A." },
    { begriff: "PZN", wert: strain.pzn ? <span className="numeric">{strain.pzn}</span> : "k. A." },
    {
      begriff: "Bestrahlung",
      wert: bestrahlungLabel[strain.bestrahlung as Bestrahlung] ?? strain.bestrahlung,
    },
    { begriff: "Anbauland", wert: strain.anbauland ?? "k. A." },
    { begriff: "Hersteller", wert: strain.hersteller ? unternehmenWert(strain.hersteller) : "k. A." },
    { begriff: "Importeur", wert: strain.importeur ? unternehmenWert(strain.importeur) : "k. A." },
    {
      begriff: "Verschreibungspflicht",
      wert: strain.verschreibungspflichtig ? "Verschreibungspflichtig" : "Nicht verschreibungspflichtig",
    },
    { begriff: "BfArM-Listung", wert: strain.bfarmGelistet ? "Gelistet" : "Nicht gelistet" },
  ];
}

/**
 * Chargentabelle. Die gemessenen Werte einer Charge stehen bewusst neben der
 * deklarierten Spanne und werden nicht mit ihr verrechnet: zwei Chargen
 * desselben Handelsnamens koennen deutlich abweichen, und genau das ist die
 * Information.
 */
function Chargentabelle({ chargen }: { chargen: StrainDetail["chargen"] }) {
  if (chargen.length === 0) {
    return <p className="text-body text-text-muted">Für dieses Produkt liegen keine Chargendaten vor.</p>;
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

/**
 * Der vollstaendige Eintrag (Spec TP2 4.3): der Kern vorn. Titelblatt, meine
 * Bewertungen, Geschmacksprofil, Community, dann die Produktdaten. Leere
 * Abschnitte entfallen, statt einen Leerzustand zu zeigen (Spec 13.3).
 */
async function ProduktInhalt({ slug }: { slug: string }) {
  const fachkreis = await istFachkreis();
  const strain = await ladeStrainDetail(slug, fachkreis);
  if (!strain) notFound();

  const { eigene, community, meineNote, communityMittel } = teileBewertungen(strain.reviews);
  const neuesteEigene = eigene[0];
  const geschmack = verdichteGeschmacksMatrix(strain.reviews);
  const produkt = { handelsname: strain.handelsname, slug: strain.slug, terpene: strain.terpene };
  const hersteller = herstellerProfil(strain.terpene);
  const intensitaet = mittleTerpenIntensitaet(strain.reviews.map((review) => parseTerpenIntensitaet(review.terpenIntensitaet)));
  const aromaSerien: AromaSerie[] = [
    ...(hersteller ? [{ name: "Laut Hersteller", ton: "gruen" as const, matrix: hersteller }] : []),
    ...(geschmack.anzahlBewertungen >= 1
      ? [{ name: "Laut Community", ton: "lila" as const, matrix: geschmack.matrix }]
      : []),
  ];
  const packungsgroessen = [...new Set(strain.bestaende.map((bestand) => bestand.packungGramm))].sort(
    (a, b) => a - b,
  );

  return (
    <>
      <Titelblatt
        handelsname={strain.handelsname}
        kultivarName={strain.kultivarName}
        kultivarTyp={strain.kultivarTyp}
        darreichungsform={strain.darreichungsform}
        anzahlApothekenVerfuegbar={strain.anzahlApothekenVerfuegbar}
        thcMin={strain.thcMinProzent}
        thcMax={strain.thcMaxProzent}
        cbdMin={strain.cbdMinProzent}
        cbdMax={strain.cbdMaxProzent}
        meineBewertung={
          neuesteEigene && meineNote !== null
            ? { note: meineNote, erstelltAm: neuesteEigene.erstelltAm, chargenNr: neuesteEigene.chargenNr }
            : null
        }
      />

      {strain.beschreibung ? (
        <p className="mt-8 max-w-[68ch] text-body text-pretty text-text">{strain.beschreibung}</p>
      ) : null}

      {eigene.length > 0 ? (
        <section aria-labelledby="meine-titel" className={cn(ABSTAND, "flex flex-col gap-8")}>
          <h2 id="meine-titel" className={ABSCHNITT_TITEL}>
            {eigene.length === 1 ? "Meine Bewertung" : "Meine Bewertungen"}
          </h2>
          {eigene.map((review) => (
            <Doppelseite key={review.id} eintrag={alsEintrag(review, produkt)} umfang="voll" ueberschrift="h3" />
          ))}
        </section>
      ) : null}

      {aromaSerien.length > 0 ? (
        <section aria-labelledby="geschmack-titel" className={cn(ABSTAND, "flex flex-col gap-4")}>
          <h2 id="geschmack-titel" className={ABSCHNITT_TITEL}>
            Stimmt das Profil?
          </h2>
          <p className="max-w-[68ch] text-body text-text-muted text-pretty">
            {geschmack.anzahlBewertungen >= 1
              ? `Grün ist, was die Herstellerangaben erwarten lassen, Lila, was ${geschmack.anzahlBewertungen} Bewertungen gefunden haben.`
              : "Grün ist, was die Herstellerangaben erwarten lassen. Mit den ersten Bewertungen kommt der Vergleich dazu."}
          </p>
          <div className="mt-4 max-w-4xl">
            <AromaKarte titel="Aroma-Karte" terpene={strain.terpene} serien={aromaSerien} />
          </div>
          <div className="mt-8 max-w-4xl">
            <SweetSpot
              titel="Terpen-Intensität laut Community"
              zeilen={Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({ terpen, wert: mittel, anzahl }))}
            />
          </div>
          <p className="mt-8">
            <Link href={`/bewerten/${strain.slug}`} className={buttonKlassen("primary", "md")}>
              Selbst bewerten
            </Link>
          </p>
          <Aufklaerung />
        </section>
      ) : null}

      {community.length > 0 && communityMittel !== null ? (
        <div className={ABSTAND}>
          <CommunityStimmen bewertungen={community} mittel={communityMittel} />
        </div>
      ) : null}

      <section aria-labelledby="daten-titel" className={ABSTAND}>
        <h2 id="daten-titel" className={ABSCHNITT_TITEL}>
          Produktdaten
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Faktenliste zeilen={produktFakten(strain)} />
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-h3 text-text">Wirkstoffspannen</h3>
              <CannabinoidBar
                className="mt-4"
                thcMin={strain.thcMinProzent}
                thcMax={strain.thcMaxProzent}
                cbdMin={strain.cbdMinProzent}
                cbdMax={strain.cbdMaxProzent}
              />
              <p className="mt-4 text-caption text-text-muted">
                {`Herstellerangabe: ${formatiereProzentSpanne(strain.thcMinProzent, strain.thcMaxProzent)} THC, ${formatiereProzentSpanne(strain.cbdMinProzent, strain.cbdMaxProzent)} CBD.`}
              </p>
            </div>
            <div>
              <h3 className="text-h3 text-text">Terpenprofil</h3>
              <TerpenChips className="mt-4" terpene={strain.terpene} />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="chargen-titel" className={ABSTAND}>
        <h2 id="chargen-titel" className={ABSCHNITT_TITEL}>
          Chargen
        </h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Gemessene Werte einzelner Chargen. Sie können innerhalb der zulässigen Toleranz von der deklarierten
          Spanne abweichen.
        </p>
        <div className="mt-8">
          <Chargentabelle chargen={strain.chargen} />
        </div>
      </section>

      <section aria-labelledby="bestaende-titel" className={ABSTAND}>
        <h2 id="bestaende-titel" className={ABSCHNITT_TITEL}>
          Apothekenbestände
        </h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Von den Apotheken gemeldeter Stand, keine Verfügbarkeitszusage.
        </p>
        <div className="mt-8">
          <BestandTabelle bestaende={strain.bestaende} fachkreis={fachkreis} />
        </div>
      </section>

      <p className={cn(ABSTAND, "text-caption text-text-muted")}>
        {`Gemeldete Packungsgrößen: ${
          packungsgroessen.length > 0 ? packungsgroessen.map((gramm) => formatiereGramm(gramm)).join(", ") : "keine"
        }. Stand der Produktdaten: ${formatiereDatum(strain.aktualisiertAm)}.`}
      </p>
    </>
  );
}

export default async function ProduktDetailPage({ params }: PageProps<"/produkte/[slug]">) {
  const { slug } = await params;
  return (
    <div className={cn(seitenRahmen(), "pt-16 pb-24 sm:pt-24")}>
      <p className="mb-8">
        <Link href="/produkte" className={einzelLinkKlassen()}>
          Alle Produkte
        </Link>
      </p>
      {/* Bewusst ohne Suspense-Grenze: notFound() antwortet so mit 404, der Inhalt ist ohne JavaScript lesbar und #eintrag-… existiert beim Sprung. */}
      <ProduktInhalt slug={slug} />
    </div>
  );
}
