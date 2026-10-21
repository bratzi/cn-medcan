import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { EigeneLikes } from "@/components/reaktionen/EigeneLikes";
import { LikeKnopf } from "@/components/reaktionen/LikeKnopf";
import { seitenRahmen } from "@/components/layout/Seitenkopf";
import { Schlagwort } from "@/components/story/Schlagwort";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenProfil } from "@/components/review/SortenKopf";
import { Titelblatt } from "@/components/produkt/Titelblatt";
import { blueteBild } from "@/lib/medien";
import { alsDiashow, budpicMeldungen } from "@/lib/budpic-anzeige";
import { musterBildId } from "@/lib/budpics";
import { ladeFreieBudpics } from "@/lib/query/budpics";
import { aehnlichImAroma } from "@/lib/query/empfehlungen";
import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { aromenText } from "@/lib/empfehlung-text";
import { Aufklaerung } from "@/components/review/Aufklaerung";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import { BewertungsBuch } from "@/components/review/BewertungsBuch";
import { ladeJuryBeitraegeZuBewertungen } from "@/lib/query/jury";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { HerstellerLeiste } from "@/components/sorte/HerstellerLeiste";
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
  formatiereZahl,
} from "@/lib/format";
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { aromaTexte } from "@/lib/i18n/typen";
import { teileBewertungen, verdichteGeschmacksMatrix } from "@/lib/query/bewertung";
import {
  ladeStrainDetail,
  ladeTerpenKatalog,
  type StrainDetail,
  type UnternehmenEintrag,
} from "@/lib/query/strains";
import { likeZahlenFuer, reaktionenFuer, teileZaehler } from "@/lib/query/reaktionen";
import { ladeSorte, ladeSortenBewertungen, waehleAktiveWare } from "@/lib/query/sorte";

/** Metadaten der Strain-Seite; ladeSorte ist je Request gecacht, die Seite liest dieselbe Zeile ohne zweite Abfrage. */
export async function sortenMetadaten(slug: string): Promise<Metadata> {
  const [sorte, w] = await Promise.all([ladeSorte(slug), holeWoerterbuch()]);
  if (!sorte) return { title: w.bluete.nichtGefunden };
  return {
    title: sorte.kultivar.name,
    description: t(w.bluete.metaBeschreibung, { handelsname: sorte.kultivar.name }),
  };
}

/** Welche Variante die Seite zeigt: ?ware= vor ?vertreiber=, sonst die meistbewertete; alle = Buch über alle Vertreiber. */
export type SortenWahl = { ware?: string; vertreiber?: string; alle: boolean };

const ABSTAND = "mt-16 sm:mt-24";
/** Sektion mit Schlagwort: der Satz steht im oberen Polster, deshalb Polster statt Rand. */
const SEKTION = "relative isolate overflow-x-clip pt-24 sm:pt-32";

/**
 * Sektionskopf wie auf der Startseite (Nutzer 2026-10-08: „nicht so
 * linksbündig, mehr zentriert“): Kapitelgrad, mittig, darunter ein Satz.
 */
function SektionsKopf({ id, titel, satz }: { id: string; titel: string; satz?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
      <h2 id={id} className="font-buch text-kapitel text-balance text-text wrap-break-word">
        {titel}
      </h2>
      {satz ? <p className="max-w-[56ch] text-body text-pretty text-text-muted">{satz}</p> : null}
    </div>
  );
}

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

/** Die vier Angaben, die zugeklappt stehen bleiben (Nutzer 2026-10-08). */
function kernFakten(strain: StrainDetail, w: Woerterbuch): Fakt[] {
  const f = w.bluete.fakten;
  const ka = f.keineAngabe;
  return [
    { begriff: f.kultivar, wert: strain.kultivarName ?? ka },
    { begriff: f.kultivartyp, wert: w.label.kultivarTyp[strain.kultivarTyp] },
    { begriff: f.vertreiber, wert: strain.vertreiber?.name ?? ka },
    { begriff: f.bestrahlung, wert: w.label.bestrahlung[strain.bestrahlung as Bestrahlung] ?? strain.bestrahlung },
  ];
}

/** Die übrigen Angaben zum Aufklappen; die Kernangaben stehen schon darüber. */
function produktFakten(strain: StrainDetail, w: Woerterbuch): Fakt[] {
  const f = w.bluete.fakten;
  const ka = f.keineAngabe;
  return [
    { begriff: f.handelsname, wert: strain.handelsname },
    { begriff: f.darreichungsform, wert: w.label.darreichungsform[strain.darreichungsform] },
    { begriff: f.genetik, wert: strain.genetik ?? ka },
    { begriff: f.pzn, wert: strain.pzn ? <span className="numeric">{strain.pzn}</span> : ka },
    { begriff: f.anbauland, wert: strain.anbauland ?? ka },
    { begriff: f.hersteller, wert: strain.hersteller ? unternehmenWert(strain.hersteller) : ka },
    { begriff: f.vertreiber, wert: strain.vertreiber ? unternehmenWert(strain.vertreiber) : ka },
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
 * Die Sortenseite (Spec Sorte im Fokus, 3): Kopf der Sorte, darunter die Ware-Leiste je Vertreiber.
 * Die gewählte Ware (`?ware=` vor `?vertreiber=`, sonst die meistbewertete) filtert das Buch und
 * liefert die Produktangaben (Angaben, Terpene, Chargen). Leere Abschnitte entfallen, statt einen
 * Leerzustand zu zeigen (Spec 13.3).
 */
async function SorteInhalt({ slug, wahl, w, sprache }: { slug: string; wahl: SortenWahl; w: Woerterbuch; sprache: Sprache }) {
  const texte = w.bluete;
  // Immer als Gast und ohne Fachkreis (Spec 2026-10-21, Seiten aus Assets, 3.1): keine Cookies, kein Mitglied.
  // Persönliches (Maske, eigene Bewertung, Live-Netz, Budpic-Zugang) lädt die Insel über /api/ich/strain.
  const fachkreis = false;
  // Zwei Runden: Sorte und Katalog, dann alles, was nur Sorte und Ware braucht; zuletzt was an Terpenen und Bewertungen hängt.
  const [sorte, katalog] = await Promise.all([ladeSorte(slug), ladeTerpenKatalog()]);
  // Alte Produktadressen leitet der Ausweichweg (page.tsx) weiter, bevor er hierher kommt.
  if (!sorte) notFound();
  const aktive = waehleAktiveWare(sorte.waren, wahl);
  if (!aktive) notFound();
  const alleVertreiber = wahl.alle || !aktive.ware.vertreiberId;
  const [strain, reviews, budpicListe, blueteLikeZahlen] = await Promise.all([
    // Nur Angaben, Terpene, Chargen: das Buch lädt ladeSortenBewertungen.
    ladeStrainDetail(aktive.produkt.slug, fachkreis, { ohneBewertungen: true }),
    ladeSortenBewertungen(sorte.kultivar.id, alleVertreiber ? null : aktive.ware.vertreiberId),
    ladeFreieBudpics([aktive.produkt.id]),
    // Likes der Blüte aus dem Zähler; ob ich geliket habe, lädt erst die Insel (Seite bleibt statisch).
    likeZahlenFuer("BLUETE", [sorte.kultivar.id]),
  ]);
  if (!strain) notFound();
  // „Ähnlich im Aroma“ (T11) rechnet D1, nicht der Worker; ohne Terpene entfällt es.
  const [aehnliche, reviewZaehler, juryBeitraege] = await Promise.all([
    strain.terpene.length > 0
      ? aehnlichImAroma(strain.id).catch((fehler: unknown) => {
          unstable_rethrow(fehler);
          console.error("aehnlichImAroma fehlgeschlagen", fehler);
          return [];
        })
      : Promise.resolve([]),
    // Ein Aufruf für alle Herzen im Bewertungsbuch (Zähler, kein COUNT über Likes).
    reaktionenFuer("BEWERTUNG", reviews.map((r) => r.id)),
    // Nur Jury-Bewertungen können einen Beitrag haben; ein Fehler lässt nur den Link weg.
    ladeJuryBeitraegeZuBewertungen(reviews.filter((r) => r.istRedaktionell).map((r) => r.id)).catch((fehler: unknown) => {
      unstable_rethrow(fehler);
      console.error("ladeJuryBeitraegeZuBewertungen fehlgeschlagen", fehler);
      return new Map<string, string>();
    }),
  ]);
  const { likes: reviewLikes, kommentare: reviewKommentare } = teileZaehler(reviewZaehler);
  const blueteLikes = blueteLikeZahlen.get(sorte.kultivar.id) ?? 0;
  const budpics = budpicListe.get(strain.id) ?? [];
  const eigeneTerpene = strain.terpene.map((terpen) => terpen.name);

  const { eigene, community, meineNote } = teileBewertungen(reviews);
  const neuesteEigene = eigene[0];
  const geschmack = verdichteGeschmacksMatrix(reviews);
  const produkt = { handelsname: sorte.kultivar.name, slug: sorte.kultivar.slug, terpene: strain.terpene, bildPfad: strain.herstellerBildPfad };
  // Das Aroma gilt der Blüte: die Mediane über alle Handelsnamen des Kultivars, sonst die eigenen.
  // Die Qualität gilt dem Vertreiber: das Charge-Fazit vergleicht mit seinem Schnitt (Spec 2026-10-13).
  const erkundung = erkundungsDaten(
    strain.terpene,
    reviews,
    w.aroma.serien,
    strain.kultivarKennwerte ?? strain.kennwerte,
    strain.vertreiberQualitaet,
  );
  // Wie viele Bewertungen hinter dem Aroma stehen: mit Median dessen Anzahl, sonst die der Ware.
  const aromaAnzahl = erkundung.median?.anzahl ?? geschmack.anzahlBewertungen;
  const zuordnung = { bluete: sorte.kultivar.name, vertreiber: aktive.ware.vertreiberName || null };
  const hauptnote = sorte.kennwerte?.gesamtnoteMittel ?? sorte.kennwerte?.gesamtnoteMedian ?? null;
  const sortenAnzahl = sorte.kennwerte?.anzahl ?? 0;
  const basis = `/blueten/${sorte.kultivar.slug}`;
  const auswahlQuery = aktive.ware.vertreiberId
    ? `vertreiber=${encodeURIComponent(aktive.ware.vertreiberId)}`
    : `ware=${encodeURIComponent(aktive.produkt.slug)}`;
  /**
   * Angaben zur Blüte (Nutzer 2026-10-03 und 2026-10-05): standen als eigene Sektion weit
   * unter der Erkundung. Sie stehen jetzt als ein Block oben, direkt hinter dem Titelblatt,
   * und tragen das Terpenprofil mit Anteilsbalken mit. Nicht gesplittet und nicht doppelt:
   * die alten Terpen-Chips entfallen, und der Sortenkopf der Erkundung bleibt der Startseite,
   * weil er auf dieser Seite Handelsname, Kultivar und Wirkstoffe des Titelblatts wiederholt.
   */
  const angabenZurBluete = (
    <section aria-labelledby="daten-titel" className={SEKTION}>
      <Schlagwort satz={texte.schlagwort.angaben} ton="gruen" />
      <SektionsKopf id="daten-titel" titel={t(texte.sorte.angabenZu, { handelsname: strain.handelsname })} />
      {/* Zugeklappt nur die vier Kernangaben (Nutzer 2026-10-08): die volle Liste
          zog die Seite in die Länge. Der Rest liegt in <details>, ohne JavaScript. */}
      <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
        {kernFakten(strain, w).map((fakt) => (
          <div key={fakt.begriff} className="flex min-w-0 flex-col gap-2">
            <dt className="text-small text-text-muted">{fakt.begriff}</dt>
            <dd className="font-buch text-h3 text-text text-balance wrap-break-word">{fakt.wert}</dd>
          </div>
        ))}
      </dl>
      <details className="group mt-12 text-center">
        <summary
          className={buttonKlassen(
            "secondary",
            "md",
            "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="group-open:hidden">{texte.alleAngaben}</span>
          <span className="hidden group-open:inline">{texte.wenigerAngaben}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 transition-transform duration-normal ease-standard group-open:rotate-180"
          >
            <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="mt-12 grid grid-cols-1 gap-12 text-start lg:grid-cols-2">
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
            {strain.terpene.length > 0 ? <TerpenProfil terpene={strain.terpene} w={w} sprache={sprache} /> : null}
          </div>
        </div>
      </details>
    </section>
  );
  // Nach dem Anmelden zurück an die Maske; das Fragment kodiert, sonst gehört es zu /anmelden.
  const anmelden = `/anmelden?weiter=${encodeURIComponent(`${basis}?${auswahlQuery}#bewerten`)}`;

  return (
    <EigeneLikes>
      {/* Kopf der Sorte (Spec Sorte im Fokus, 3): Name, Genetik, Typ, Spanne über alle Vertreiber. */}
      <Titelblatt
        handelsname={sorte.kultivar.name}
        kultivarName={sorte.kultivar.genetik}
        vertreiberZeile={texte.sorte.spanne}
        kultivarTyp={sorte.kultivar.typ}
        darreichungsform={strain.darreichungsform}
        anzahlApothekenVerfuegbar={strain.anzahlApothekenVerfuegbar}
        thcMin={sorte.spanne.thcMin ?? strain.thcMinProzent}
        thcMax={sorte.spanne.thcMax ?? strain.thcMaxProzent}
        cbdMin={sorte.spanne.cbdMin ?? strain.cbdMinProzent}
        cbdMax={sorte.spanne.cbdMax ?? strain.cbdMaxProzent}
        bild={blueteBild(strain.herstellerBildPfad) ?? musterBildId(strain.slug)}
        budpic={{
          strainId: strain.id,
          slug: strain.slug,
          kultivarSlug: sorte.kultivar.slug,
          bilder: alsDiashow(budpics, w, sprache),
          zugang: "gast",
        }}
        w={w}
        sprache={sprache}
        meineBewertung={
          neuesteEigene && meineNote !== null
            ? { note: meineNote, erstelltAm: neuesteEigene.erstelltAm, chargenNr: neuesteEigene.chargenNr }
            : null
        }
      />

      {/* Hauptnote der Sorte über alle Vertreiber (KultivarKennwerte), mit Anzahl. */}
      <div className="mt-8 flex flex-col gap-2">
        {hauptnote !== null && sortenAnzahl > 0 ? (
          <>
            <BlattAnzeige note={hauptnote} text={t(texte.sorte.hauptnote, { note: formatiereZahl(hauptnote, 1, sprache) })} />
            <p className="numeric text-small text-text-muted">{mehrzahl(sprache, texte.sorte.anzahl, sortenAnzahl)}</p>
          </>
        ) : (
          <p className="text-small text-text-muted">{texte.sorte.ohneNote}</p>
        )}
      </div>

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
        <LikeKnopf art="BLUETE" zielId={sorte.kultivar.id} anzahl={blueteLikes} text={w.reaktionen.knopf} />
      </p>

      {strain.beschreibung ? (
        <p className="mt-8 max-w-[68ch] text-body text-pretty text-text">{strain.beschreibung}</p>
      ) : null}

      {angabenZurBluete}

      {/* Reihenfolge Spec 2026-10-21, 1: Strain, Angaben, Auswahl des Vertreibers, Wertung, Buch, Rest.
          Die Leiste filtert Buch und Angaben und belegt die Bewertung vor; ohne Kauflink (HWG). */}
      <div className={ABSTAND}>
        <HerstellerLeiste
          waren={sorte.waren}
          aktiveVertreiberId={aktive.ware.vertreiberId}
          slug={sorte.kultivar.slug}
          texte={texte.vertreiber}
          sprache={sprache}
        />
      </div>

      {/* Bewerten an der Stelle der Erkundung (Masterplan Bewertung v2, T4; /bewerten entfällt):
          freigeschaltete Mitglieder sehen die Maske, vorbelegt mit ihrer eigenen Bewertung; alle
          anderen die Erkundung zum Ausprobieren und darunter, was ihnen zum Bewerten fehlt. */}
      <section
        id="bewerten"
        aria-labelledby="bewerten-titel"
        // Ab 118rem steht das Fazit samt Live-Netz rechts neben der Maske, außerhalb der Sektion
        // (FazitLauf); overflow-x-clip schnitt es ab (live 2026-10-09). Den Schlagwort-Satz
        // beschneidet seither Schlagwort selbst. Knapp über 118rem lag die Spalte unter der
        // Schalterleiste und ragte über den Rand (live 2026-10-09): die Sektion rückt dort nach
        // links, bis der Seitenrand ab 128rem von selbst reicht.
        className={cn(SEKTION, "flex scroll-mt-[calc(var(--kopf-h,4rem)+2rem)] flex-col gap-4 min-[118rem]:right-[max(0px,calc(5rem_-_(100vw_-_118rem)_/_2))] min-[118rem]:overflow-x-visible")}
      >
        <Schlagwort satz={texte.schlagwort.bewerten} ton="gruen" />
        <SektionsKopf
          id="bewerten-titel"
          titel={erkundung.serien.length > 0 ? texte.profilFrage : texte.bewerten}
          satz={
            erkundung.serien.length > 0
                ? aromaAnzahl >= 1
                  ? t(texte.profilMitCommunity, { anzahl: aromaAnzahl })
                  : texte.profilOhneCommunity
              : undefined
          }
        />
        <>
            {erkundung.serien.length > 0 ? (
              <div className="mt-8">
                <AromaErkundung
                  titel={sorte.kultivar.name}
                  terpene={strain.terpene}
                  katalog={katalog}
                  texte={aromaTexte(w, sprache)}
                  zuordnung={zuordnung}
                  {...erkundung}
                />
              </div>
            ) : null}
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <p className="max-w-[60ch] text-body text-text">{w.bewerten.anmeldenHinweis}</p>
              <a href={anmelden} className={buttonKlassen("primary", "md")}>
                {w.bewerten.anmelden}
              </a>
            </div>
          </>
        {erkundung.serien.length > 0 ? <Aufklaerung texte={w.aroma.aufklaerung} sprache={sprache} /> : null}
      </section>

      {/* Bewertungen der Sorte als ein Buch zum Blättern (T7): Betreiber zuerst, dann die Community;
          gefiltert auf den Vertreiber der Auswahl, umschaltbar auf alle Vertreiber. */}
      <div className={SEKTION}>
        <Schlagwort satz={texte.schlagwort.bewertungen} ton="lila" />
        {aktive.ware.vertreiberId ? (
          <nav aria-label={texte.vertreiber.bewertungenFilter} className="mb-8 flex flex-wrap justify-center gap-2">
            <a
              href={`${basis}?${auswahlQuery}`}
              aria-current={alleVertreiber ? undefined : "true"}
              className={buttonKlassen(alleVertreiber ? "secondary" : "primary", "md")}
            >
              {t(texte.vertreiber.nurAuswahl, { name: aktive.ware.vertreiberName || texte.vertreiber.unbekannt })}
            </a>
            <a
              href={`${basis}?${auswahlQuery}&${new URLSearchParams({ alle: "1" })}`}
              aria-current={alleVertreiber ? "true" : undefined}
              className={buttonKlassen(alleVertreiber ? "primary" : "secondary", "md")}
            >
              {texte.vertreiber.alleVertreiber}
            </a>
          </nav>
        ) : null}
        <BewertungsBuch reviews={reviews} kennwerte={sorte.kennwerte} produkt={produkt} w={w} sprache={sprache} katalog={katalog} likes={reviewLikes} kommentare={reviewKommentare} juryBeitraege={juryBeitraege} />
      </div>

      {aehnliche.length > 0 ? (
        <section aria-labelledby="aehnlich-titel" className={SEKTION}>
          <Schlagwort satz={texte.schlagwort.aehnlich} ton="lila" />
          <SektionsKopf
            id="aehnlich-titel"
            titel={w.empfehlung.bluetenTitel}
            satz={`${w.empfehlung.bluetenSatz} ${w.empfehlung.hinweis}`}
          />
          <EmpfehlungsListe
            className="mt-8"
            eintraege={aehnliche.map((a) => ({
              slug: a.slug,
              kultivarSlug: a.kultivarSlug,
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
        <SektionsKopf id="chargen-titel" titel={texte.chargen} satz={texte.chargenSatz} />
        <div className="mt-8">
          <Chargentabelle chargen={strain.chargen} w={w} sprache={sprache} />
        </div>
      </section>

      {/* Apotheken, Bestände und Preise seit 2026-09-25 nur in Aussicht (Nutzer). */}
      <p className={cn(ABSTAND, "text-caption text-text-muted")}>
        {t(texte.aussicht, { datum: formatiereDatum(strain.aktualisiertAm, sprache) })}
      </p>
    </EigeneLikes>
  );
}

/** Rahmen der Strain-Seite; [auswahl]/page.tsx (statisch) und der Ausweichweg page.tsx teilen ihn. */
export async function SortenSeite({ slug, wahl }: { slug: string; wahl: SortenWahl }) {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return (
    <div className={cn(seitenRahmen(), "pt-16 pb-24 sm:pt-24")}>
      <p className="mb-8">
        <a href="/blueten" className={einzelLinkKlassen()}>
          {w.bluete.alleBlueten}
        </a>
      </p>
      {/* Bewusst ohne Suspense-Grenze: notFound() antwortet so mit 404, der Inhalt ist ohne JavaScript lesbar und #eintrag-… existiert beim Sprung. */}
      <SorteInhalt slug={slug} wahl={wahl} w={w} sprache={sprache} />
    </div>
  );
}
