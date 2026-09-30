import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ABSCHNITT_TITEL, seitenRahmen } from "@/components/layout/Seitenkopf";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Titelblatt } from "@/components/produkt/Titelblatt";
import { blueteBild } from "@/lib/medien";
import { alsDiashow } from "@/lib/budpic-anzeige";
import { musterBildId } from "@/lib/budpics";
import { ladeFreieBudpics } from "@/lib/query/budpics";
import { aehnlichImAroma } from "@/lib/query/empfehlungen";
import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { aromenText } from "@/lib/empfehlung-text";
import { Aufklaerung } from "@/components/review/Aufklaerung";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import { BewertungsBuch } from "@/components/review/BewertungsBuch";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { eintragAnker } from "@/components/review/eintrag";
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
  formatiereProzent,
  formatiereProzentSpanne,
} from "@/lib/format";
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { aromaTexte } from "@/lib/i18n/typen";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { teileBewertungen, verdichteGeschmacksMatrix } from "@/lib/query/bewertung";
import { istFachkreis } from "@/lib/query/fachkreis";
import {
  ladeEigeneBewertung,
  ladeStrainDetail,
  ladeStrainTitel,
  ladeTerpenKatalog,
  type StrainDetail,
  type UnternehmenEintrag,
} from "@/lib/query/strains";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine zur Buildzeit
 * erreichbare Datenbank - das D1-Binding existiert erst im Request. Entfaellt,
 * sobald ISR und die Cache-Bindings (KV, D1-Tags) stehen; dann gehoert hier
 * `generateStaticParams` hin (edge-stack-master, Caching-Kaskade Stufe 1).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blueten/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [handelsname, w] = await Promise.all([ladeStrainTitel(slug), holeWoerterbuch()]);
  if (!handelsname) return { title: w.bluete.nichtGefunden };
  return {
    title: handelsname,
    description: t(w.bluete.metaBeschreibung, { handelsname }),
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

function produktFakten(strain: StrainDetail, w: Woerterbuch): Fakt[] {
  const f = w.bluete.fakten;
  const ka = f.keineAngabe;
  return [
    { begriff: f.handelsname, wert: strain.handelsname },
    { begriff: f.kultivar, wert: strain.kultivarName ?? ka },
    { begriff: f.kultivartyp, wert: w.label.kultivarTyp[strain.kultivarTyp] },
    { begriff: f.darreichungsform, wert: w.label.darreichungsform[strain.darreichungsform] },
    { begriff: f.genetik, wert: strain.genetik ?? ka },
    { begriff: f.pzn, wert: strain.pzn ? <span className="numeric">{strain.pzn}</span> : ka },
    {
      begriff: f.bestrahlung,
      wert: w.label.bestrahlung[strain.bestrahlung as Bestrahlung] ?? strain.bestrahlung,
    },
    { begriff: f.anbauland, wert: strain.anbauland ?? ka },
    { begriff: f.hersteller, wert: strain.hersteller ? unternehmenWert(strain.hersteller) : ka },
    { begriff: f.importeur, wert: strain.importeur ? unternehmenWert(strain.importeur) : ka },
    {
      begriff: f.verschreibungspflicht,
      wert: strain.verschreibungspflichtig ? f.verschreibungspflichtig : f.nichtVerschreibungspflichtig,
    },
    { begriff: f.bfarm, wert: strain.bfarmGelistet ? f.gelistet : f.nichtGelistet },
  ];
}

/**
 * Chargentabelle. Die gemessenen Werte einer Charge stehen bewusst neben der
 * deklarierten Spanne und werden nicht mit ihr verrechnet: zwei Chargen
 * desselben Handelsnamens koennen deutlich abweichen, und genau das ist die
 * Information.
 */
function Chargentabelle({ chargen, w, sprache }: { chargen: StrainDetail["chargen"]; w: Woerterbuch; sprache: Sprache }) {
  const texte = w.bluete;
  if (chargen.length === 0) {
    return <p className="text-body text-text-muted">{texte.keineChargen}</p>;
  }
  return (
    <Table caption={texte.chargenTabelle} captionVersteckt>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{texte.spalten.charge}</TableHeaderCell>
          <TableHeaderCell numerisch>{texte.spalten.thc}</TableHeaderCell>
          <TableHeaderCell numerisch>{texte.spalten.cbd}</TableHeaderCell>
          <TableHeaderCell>{texte.spalten.analyse}</TableHeaderCell>
          <TableHeaderCell>{texte.spalten.verfall}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {chargen.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>
              <span className="numeric">{charge.chargenNr}</span>
            </TableCell>
            <TableCell numerisch>{formatiereProzent(charge.thcIst, 1, sprache)}</TableCell>
            <TableCell numerisch>{formatiereProzent(charge.cbdIst, 1, sprache)}</TableCell>
            <TableCell>{formatiereDatum(charge.analysedatum, sprache)}</TableCell>
            <TableCell>{formatiereDatum(charge.verfallsdatum, sprache)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Der vollstaendige Eintrag (Spec TP2 4.3): der Kern vorn. Titelblatt, das
 * Buch mit allen Bewertungen (seit T7: Betreiber, dann Community), das
 * Geschmacksprofil mit der Bewertungsmaske (#bewerten), dann die
 * Produktdaten. Leere Abschnitte entfallen, statt einen Leerzustand zu zeigen
 * (Spec 13.3).
 */
async function ProduktInhalt({ slug, w, sprache }: { slug: string; w: Woerterbuch; sprache: Sprache }) {
  const fachkreis = await istFachkreis();
  const texte = w.bluete;
  const [strain, katalog, mitglied] = await Promise.all([
    ladeStrainDetail(slug, fachkreis),
    ladeTerpenKatalog(),
    aktuellesMitglied(),
  ]);
  if (!strain) notFound();
  // „Ähnlich im Aroma“ (T11) rechnet D1, nicht der Worker; ohne Terpene entfällt es.
  const [budpicListe, aehnliche] = await Promise.all([
    ladeFreieBudpics([strain.id]),
    strain.terpene.length > 0 ? aehnlichImAroma(strain.id) : Promise.resolve([]),
  ]);
  const budpics = budpicListe.get(strain.id) ?? [];
  const eigeneTerpene = strain.terpene.map((terpen) => terpen.name);

  const { eigene, community, meineNote } = teileBewertungen(strain.reviews);
  const neuesteEigene = eigene[0];
  const geschmack = verdichteGeschmacksMatrix(strain.reviews);
  const produkt = { handelsname: strain.handelsname, slug: strain.slug, terpene: strain.terpene, bildPfad: strain.herstellerBildPfad };
  const erkundung = erkundungsDaten(strain.terpene, strain.reviews, w.aroma.serien, strain.kennwerte);
  // Die eigene Bewertung (auch unfreigegeben) belegt die Maske vor; nur wer bewerten darf, braucht sie.
  const eigeneBewertung = mitglied?.freigegeben ? await ladeEigeneBewertung(mitglied.mitgliedId, strain.id) : null;
  const vorbelegung = eigeneBewertung ? vorbelegungAus(eigeneBewertung) : null;
  // Nach dem Anmelden zurück an die Maske; das Fragment kodiert, sonst gehört es zu /anmelden.
  const anmelden = `/anmelden?weiter=${encodeURIComponent(`/blueten/${strain.slug}#bewerten`)}`;

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
        bild={blueteBild(strain.herstellerBildPfad) ?? musterBildId(strain.slug)}
        budpic={{
          strainId: strain.id,
          slug: strain.slug,
          bilder: alsDiashow(budpics, w, sprache),
          zugang: !mitglied ? "gast" : mitglied.freigegeben ? "freigegeben" : "mitglied",
        }}
        w={w}
        sprache={sprache}
        meineBewertung={
          neuesteEigene && meineNote !== null
            ? { note: meineNote, erstelltAm: neuesteEigene.erstelltAm, chargenNr: neuesteEigene.chargenNr }
            : null
        }
      />

      {/* Jede Sorte ist bewertbar, unabhängig von einer Umfrage; die Umfrage rückt
          eine Sorte nur zeitweise nach vorn. */}
      <p className="mt-8 flex flex-wrap items-center gap-4">
        <a href="#bewerten" className={buttonKlassen("primary", "md")}>
          {texte.bewerten}
        </a>
        {/* Mit Community-Bewertungen schlägt der Link im Buch deren erste Seite auf (Anker #eintrag-…). */}
        <a
          href={community.length > 0 ? `#${eintragAnker(community[0].id)}` : "#bewertungen-titel"}
          className="text-small text-accent underline underline-offset-4 hover:text-accent-hover"
        >
          {community.length > 0
            ? mehrzahl(sprache, texte.communityLesen, community.length)
            : texte.nochKeineCommunity}
        </a>
      </p>

      {strain.beschreibung ? (
        <p className="mt-8 max-w-[68ch] text-body text-pretty text-text">{strain.beschreibung}</p>
      ) : null}

      {/* Alle Bewertungen der Sorte als ein Buch zum Blättern (T7): Betreiber zuerst,
          dann die Community. Ersetzt die eigenen Doppelseiten untereinander und die Liste. */}
      <div className={ABSTAND}>
        <BewertungsBuch reviews={strain.reviews} kennwerte={strain.kennwerte} produkt={produkt} w={w} sprache={sprache} />
      </div>

      {/* Bewerten an der Stelle der Erkundung (Masterplan Bewertung v2, T4; /bewerten entfällt):
          freigeschaltete Mitglieder sehen die Maske, vorbelegt mit ihrer eigenen Bewertung; alle
          anderen die Erkundung zum Ausprobieren und darunter, was ihnen zum Bewerten fehlt. */}
      <section
        id="bewerten"
        aria-labelledby="bewerten-titel"
        className={cn(ABSTAND, "flex scroll-mt-[calc(var(--kopf-h,4rem)+2rem)] flex-col gap-4")}
      >
        <h2 id="bewerten-titel" className={ABSCHNITT_TITEL}>
          {mitglied?.freigegeben
            ? vorbelegung
              ? texte.deineBewertung
              : texte.bewerten
            : erkundung.serien.length > 0
              ? texte.profilFrage
              : texte.bewerten}
        </h2>
        {mitglied?.freigegeben ? (
          <>
            <p className="max-w-[68ch] text-body text-text-muted text-pretty">{w.bewerten.satz}</p>
            <div className="mt-4">
              <BewertungsFormular
                strainId={strain.id}
                handelsname={strain.handelsname}
                terpene={strain.terpene}
                chargen={strain.chargen.map((charge) => charge.chargenNr)}
                istBetreiber={mitglied.rolle === "ADMIN"}
                katalog={katalog}
                vorbelegung={vorbelegung}
                aromaTexte={aromaTexte(w, sprache)}
                texte={w.bewerten}
                {...erkundung}
              />
            </div>
          </>
        ) : (
          <>
            {erkundung.serien.length > 0 ? (
              <>
                <p className="max-w-[68ch] text-body text-text-muted text-pretty">
                  {geschmack.anzahlBewertungen >= 1
                    ? t(texte.profilMitCommunity, { anzahl: geschmack.anzahlBewertungen })
                    : texte.profilOhneCommunity}
                </p>
                <div className="mt-4">
                  <AromaErkundung
                    titel={strain.handelsname}
                    terpene={strain.terpene}
                    katalog={katalog}
                    texte={aromaTexte(w, sprache)}
                    {...erkundung}
                  />
                </div>
              </>
            ) : null}
            <div className="mt-8 flex flex-col items-start gap-4">
              {mitglied ? (
                <p className="max-w-[60ch] text-body text-text">{w.bewerten.nichtFreigegeben}</p>
              ) : (
                <>
                  <p className="max-w-[60ch] text-body text-text">{w.bewerten.anmeldenHinweis}</p>
                  <Link href={anmelden} className={buttonKlassen("primary", "md")}>
                    {w.bewerten.anmelden}
                  </Link>
                </>
              )}
            </div>
          </>
        )}
        {erkundung.serien.length > 0 ? <Aufklaerung texte={w.aroma.aufklaerung} /> : null}
      </section>

      <section aria-labelledby="daten-titel" className={ABSTAND}>
        <h2 id="daten-titel" className={ABSCHNITT_TITEL}>
          {texte.angaben}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Faktenliste zeilen={produktFakten(strain, w)} />
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-h3 text-text">{texte.wirkstoffspannen}</h3>
              <CannabinoidBar
                className="mt-4"
                thcMin={strain.thcMinProzent}
                thcMax={strain.thcMaxProzent}
                cbdMin={strain.cbdMinProzent}
                cbdMax={strain.cbdMaxProzent}
                w={w}
                sprache={sprache}
              />
              <p className="mt-4 text-caption text-text-muted">
                {t(texte.herstellerangabe, {
                  thc: formatiereProzentSpanne(strain.thcMinProzent, strain.thcMaxProzent, 1, sprache),
                  cbd: formatiereProzentSpanne(strain.cbdMinProzent, strain.cbdMaxProzent, 1, sprache),
                })}
              </p>
            </div>
            <div>
              <h3 className="text-h3 text-text">{texte.terpenprofil}</h3>
              <TerpenChips className="mt-4" terpene={strain.terpene} w={w} sprache={sprache} />
            </div>
          </div>
        </div>
      </section>

      {aehnliche.length > 0 ? (
        <section aria-labelledby="aehnlich-titel" className={ABSTAND}>
          <h2 id="aehnlich-titel" className={ABSCHNITT_TITEL}>
            {w.empfehlung.bluetenTitel}
          </h2>
          <p className="mt-2 max-w-[68ch] text-small text-text-muted">
            {w.empfehlung.bluetenSatz} {w.empfehlung.hinweis}
          </p>
          <EmpfehlungsListe
            className="mt-8"
            eintraege={aehnliche.map((a) => ({
              slug: a.slug,
              handelsname: a.handelsname,
              // Gemeinsame Terpene in der Rangfolge dieser Sorte, höchstens drei.
              begruendung: t(w.empfehlung.gemeinsam, {
                aromen: aromenText(
                  eigeneTerpene.filter((name) => a.gemeinsam.includes(name)).slice(0, 3).map((name) => `t:${name}`),
                  w,
                  sprache,
                ),
              }),
            }))}
          />
        </section>
      ) : null}

      <section aria-labelledby="chargen-titel" className={ABSTAND}>
        <h2 id="chargen-titel" className={ABSCHNITT_TITEL}>
          {texte.chargen}
        </h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          {texte.chargenSatz}
        </p>
        <div className="mt-8">
          <Chargentabelle chargen={strain.chargen} w={w} sprache={sprache} />
        </div>
      </section>

      {/* Apotheken, Bestände und Preise seit 2026-09-25 nur in Aussicht (Nutzer). */}
      <p className={cn(ABSTAND, "text-caption text-text-muted")}>
        {t(texte.aussicht, { datum: formatiereDatum(strain.aktualisiertAm, sprache) })}
      </p>
    </>
  );
}

export default async function ProduktDetailPage({ params }: PageProps<"/blueten/[slug]">) {
  const { slug } = await params;
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return (
    <div className={cn(seitenRahmen(), "pt-16 pb-24 sm:pt-24")}>
      <p className="mb-8">
        <Link href="/blueten" className={einzelLinkKlassen()}>
          {w.bluete.alleBlueten}
        </Link>
      </p>
      {/* Bewusst ohne Suspense-Grenze: notFound() antwortet so mit 404, der Inhalt ist ohne JavaScript lesbar und #eintrag-… existiert beim Sprung. */}
      <ProduktInhalt slug={slug} w={w} sprache={sprache} />
    </div>
  );
}
