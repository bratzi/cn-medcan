import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { FilterLeiste } from "@/components/produkt/FilterLeiste";
import { ProduktCard } from "@/components/produkt/ProduktCard";
import { EmptyState, Spinner, buttonKlassen, textLinkKlassen } from "@/components/ui";
import { parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";
import type { StrainFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeFilterFacetten, ladeStrainListe } from "@/lib/query/strains";

export const metadata: Metadata = {
  title: "Blüten — Medizinalcannabis-Katalog",
  description:
    "Alle gelisteten Medizinalcannabis-Blüten mit Kultivar-Typ, Darreichungsform, THC-Spanne, dominantem Geschmack und Apothekenverfügbarkeit filtern.",
};

/**
 * Dynamisches Rendern: die Liste haengt an Suchparametern und am
 * Fachkreis-Status (Cookie), und die Datenbank ist zur Buildzeit nicht
 * erreichbar. Diese Zeile faellt weg, sobald ISR mit den R2-Bindings
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 text-text">Blüten</h1>
        <p className="max-w-[68ch] text-body text-text-muted">
          Alle hier gelisteten Blüten sind verschreibungspflichtig und nur mit
          ärztlicher Verordnung über eine Apotheke beziehbar.
        </p>
      </header>

      <Suspense
        key={serialisiereFilter(filter).toString()}
        fallback={
          <div className="mt-10">
            <Spinner text="Blüten werden geladen" />
          </div>
        }
      >
        <Ergebnisbereich filter={filter} />
      </Suspense>
    </main>
  );
}

/** Einstieg "Bluete vorschlagen", mit dem Suchbegriff als Vorbelegung. */
function vorschlagLink(suche: string | undefined): string {
  return suche ? `/vorschlagen?name=${encodeURIComponent(suche)}` : "/vorschlagen";
}

async function Ergebnisbereich({ filter }: { filter: StrainFilter }) {
  const fachkreis = await istFachkreis();
  // Zwei parallele Abfragen: Liste und Facetten blockieren sich nicht.
  const [liste, facetten] = await Promise.all([
    ladeStrainListe(filter, fachkreis),
    ladeFilterFacetten(fachkreis),
  ]);

  const apothekenNamen = new Map(
    facetten.apotheken.map((apotheke) => [apotheke.slug, apotheke.name]),
  );

  return (
    <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-16">
      <aside className="w-full shrink-0 lg:w-72" aria-label="Filter">
        <FilterLeiste facetten={facetten} filter={filter} gesamt={liste.gesamt} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <p className="text-small text-text-muted">
          <span className="numeric">{liste.eintraege.length}</span> von{" "}
          <span className="numeric">{liste.gesamt}</span>{" "}
          {liste.gesamt === 1 ? "Blüte" : "Blüten"}
        </p>

        <AktiveFilter filter={filter} apothekenNamen={apothekenNamen} />

        {liste.eintraege.length === 0 ? (
          <EmptyState
            titel="Keine Blüten gefunden"
            beschreibung="Zu dieser Filterkombination ist keine Blüte gelistet. Weniger Kriterien führen meist zu Treffern. Fehlt dir eine Blüte, schlag sie vor."
            aktion={
              <div className="flex flex-wrap gap-4">
                <Link href="/produkte" className={buttonKlassen("secondary")}>
                  Alle Filter zurücksetzen
                </Link>
                <Link href={vorschlagLink(filter.q)} className={buttonKlassen("secondary")}>
                  Blüte vorschlagen
                </Link>
              </div>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {liste.eintraege.map((strain) => (
              <li key={strain.id} className="flex">
                <ProduktCard strain={strain} className="w-full" />
              </li>
            ))}
          </ul>
        )}

        <p className="text-small text-text-muted">
          Blüte fehlt?{" "}
          <Link href={vorschlagLink(filter.q)} className={textLinkKlassen()}>
            Schlag sie vor
          </Link>
        </p>

        {liste.seitenAnzahl > 1 ? (
          <nav
            aria-label="Seitennavigation"
            className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"
          >
            {liste.seite > 1 ? (
              <Link
                href={`/produkte?${serialisiereFilter({ ...filter, seite: liste.seite - 1 }).toString()}`}
                className={buttonKlassen("secondary")}
                rel="prev"
              >
                Vorige Seite
              </Link>
            ) : (
              <span />
            )}

            <p className="text-small text-text-muted">
              Seite <span className="numeric">{liste.seite}</span> von{" "}
              <span className="numeric">{liste.seitenAnzahl}</span>
            </p>

            {liste.seite < liste.seitenAnzahl ? (
              <Link
                href={`/produkte?${serialisiereFilter({ ...filter, seite: liste.seite + 1 }).toString()}`}
                className={buttonKlassen("secondary")}
                rel="next"
              >
                Nächste Seite
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
