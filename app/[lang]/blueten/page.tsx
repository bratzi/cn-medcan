import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { FilterLeiste } from "@/components/produkt/FilterLeiste";
import { alsDiashow } from "@/lib/budpic-anzeige";
import { budpicZugang, ladeFreieBudpics } from "@/lib/query/budpics";
import { ProduktCard } from "@/components/produkt/ProduktCard";
import { EmptyState, Spinner, buttonKlassen, textLinkKlassen } from "@/components/ui";
import { parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";
import type { StrainFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeFilterFacetten, ladeStrainListe } from "@/lib/query/strains";
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.katalog.metaTitel, description: w.katalog.metaBeschreibung };
}

/**
 * Dynamisches Rendern: die Liste haengt an Suchparametern und am
 * Fachkreis-Status (Cookie), und die Datenbank ist zur Buildzeit nicht
 * erreichbar. Diese Zeile faellt weg, sobald ISR mit den Cache-Bindings (KV)
 * (NEXT_INC_CACHE_R2_BUCKET, WORKER_SELF_REFERENCE) eingerichtet ist —
 * siehe .claude/skills/edge-stack-master.md, Abschnitt 6.
 */
export const dynamic = "force-dynamic";

type SuchParameter = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SuchParameter>;
};

export default async function ProduktePage({ searchParams }: Props) {
  const filter = parseStrainFilter(await searchParams);
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 text-text">{w.katalog.titel}</h1>
        <p className="max-w-[68ch] text-body text-text-muted">
          {w.katalog.einleitung}
        </p>
      </header>

      <Suspense
        key={serialisiereFilter(filter).toString()}
        fallback={
          <div className="mt-10">
            <Spinner text={w.katalog.laedt} />
          </div>
        }
      >
        <Ergebnisbereich filter={filter} w={w} sprache={sprache} />
      </Suspense>
    </main>
  );
}

/** Einstieg "Bluete vorschlagen", mit dem Suchbegriff als Vorbelegung. */
function vorschlagLink(suche: string | undefined): string {
  return suche ? `/vorschlagen?name=${encodeURIComponent(suche)}` : "/vorschlagen";
}

async function Ergebnisbereich({ filter, w, sprache }: { filter: StrainFilter; w: Woerterbuch; sprache: Sprache }) {
  const texte = w.katalog;
  const fachkreis = await istFachkreis();
  // Zwei parallele Abfragen: Liste und Facetten blockieren sich nicht.
  const [liste, facetten, zugang] = await Promise.all([
    ladeStrainListe(filter, fachkreis),
    ladeFilterFacetten(fachkreis),
    budpicZugang(),
  ]);
  // Budpics (T9): eine Abfrage fuer alle Karten der Seite, danach je Sorte gezeigt.
  const budpics = await ladeFreieBudpics(liste.eintraege.map((e) => e.id));

  const apothekenNamen = new Map(
    facetten.apotheken.map((apotheke) => [apotheke.slug, apotheke.name]),
  );
  const herstellerNamen = new Map(facetten.hersteller.map((h) => [h.id, h.name]));

  return (
    <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-16">
      <aside className="w-full shrink-0 lg:w-72" aria-label={texte.filter}>
        <FilterLeiste
          facetten={facetten}
          filter={filter}
          gesamt={liste.gesamt}
          texte={texte.leiste}
          titel={texte.filter}
          zuruecksetzen={texte.zuruecksetzen}
          labels={{ kultivarTyp: w.label.kultivarTyp, darreichungsform: w.label.darreichungsform, geschmack: w.label.geschmack }}
          sprache={sprache}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <p className="text-small text-text-muted numeric">
          {mehrzahl(sprache, texte.anzahl, liste.gesamt, { sichtbar: liste.eintraege.length })}
        </p>

        <AktiveFilter filter={filter} apothekenNamen={apothekenNamen} herstellerNamen={herstellerNamen} w={w} sprache={sprache} />

        {liste.eintraege.length === 0 ? (
          <EmptyState
            titel={texte.leerTitel}
            beschreibung={texte.leerText}
            aktion={
              <div className="flex flex-wrap gap-4">
                <Link prefetch={false} href="/blueten" className={buttonKlassen("secondary")}>
                  {texte.zuruecksetzen}
                </Link>
                <Link prefetch={false} href={vorschlagLink(filter.q)} className={buttonKlassen("secondary")}>
                  {texte.vorschlagen}
                </Link>
              </div>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {liste.eintraege.map((strain) => (
              <li key={strain.id} className="flex">
                <ProduktCard
                  strain={strain}
                  w={w}
                  sprache={sprache}
                  className="w-full"
                  budpics={alsDiashow(budpics.get(strain.id) ?? [], w, sprache)}
                  zugang={zugang}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Im leeren Ergebnis steht der Einstieg schon im Leerzustand. */}
        {liste.eintraege.length > 0 ? (
          <p className="text-small text-text-muted">
            {texte.fehlt}{" "}
            <Link prefetch={false} href={vorschlagLink(filter.q)} className={textLinkKlassen()}>
              {texte.schlagVor}
            </Link>
          </p>
        ) : null}

        {liste.seitenAnzahl > 1 ? (
          <nav
            aria-label={texte.seitennavigation}
            className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"
          >
            {liste.seite > 1 ? (
              <Link prefetch={false}
                href={`/blueten?${serialisiereFilter({ ...filter, seite: liste.seite - 1 }).toString()}`}
                className={buttonKlassen("secondary")}
                rel="prev"
              >
                {texte.vorige}
              </Link>
            ) : (
              <span />
            )}

            <p className="numeric text-small text-text-muted">
              {t(texte.seiteVon, { seite: liste.seite, seiten: liste.seitenAnzahl })}
            </p>

            {liste.seite < liste.seitenAnzahl ? (
              <Link prefetch={false}
                href={`/blueten?${serialisiereFilter({ ...filter, seite: liste.seite + 1 }).toString()}`}
                className={buttonKlassen("secondary")}
                rel="next"
              >
                {texte.naechste}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
