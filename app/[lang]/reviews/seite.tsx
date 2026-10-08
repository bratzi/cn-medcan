import Link from "next/link";
import { notFound } from "next/navigation";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Ranglisten } from "@/components/rangliste/Ranglisten";
import { GrossesBuch } from "@/components/review/GrossesBuch";
import { Schlagwort } from "@/components/story/Schlagwort";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { ladeBand } from "@/lib/query/buch-band";
import { ladeTerpenKatalog } from "@/lib/query/strains";

/**
 * Das große Buch (Spec Bewertungsbuch 4): ein Band mit bis zu 24 Bewertungen über alle Sorten.
 * Gemeinsamer Inhalt von /reviews (Band 1) und /reviews/band/[band]; beide Routen sind statisch.
 * Ein Band, den es nicht gibt, ist 404, nie ein leeres Buch. Darunter die Ranglisten je Sorte
 * (Spec 5): eine Insel, die nur für angemeldete Mitglieder Daten holt; die Seite bleibt statisch.
 */
export async function BewertungenSeite({ band }: { band: number }) {
  const [daten, w, sprache, katalog] = await Promise.all([
    ladeBand(band),
    holeWoerterbuch(),
    holeSprache(),
    ladeTerpenKatalog(),
  ]);
  if (!daten) notFound();

  return (
    <>
      <Seitenkopf titel={w.reviews.titel} satz={w.reviews.satz} mittig />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        {/* Bewusst ohne Suspense-Grenze: der Inhalt steht im ersten HTML, damit er ohne JavaScript lesbar ist und Sprungziele (#eintrag-…) existieren. */}
        {daten.gesamt === 0 ? (
          <EmptyState
            titel={w.reviews.leerTitel}
            beschreibung={w.reviews.leerText}
            aktion={
              <Link prefetch={false} href="/umfragen" className={buttonKlassen("secondary")}>
                {w.reviews.zurAbstimmung}
              </Link>
            }
          />
        ) : (
          <GrossesBuch band={daten} w={w} sprache={sprache} katalog={katalog} />
        )}
        {/* Anker #ranglisten: dorthin führt das Anmelden aus der Insel zurück. */}
        <section
          id="ranglisten"
          aria-labelledby="ranglisten-titel"
          className="relative isolate mt-16 scroll-mt-[calc(var(--kopf-h,4rem)+2rem)] overflow-x-clip pt-24 sm:mt-24 sm:pt-32"
        >
          <Schlagwort satz={w.rangliste.schlagwort} ton="gruen" />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h2 id="ranglisten-titel" className="font-buch text-kapitel text-balance text-text">
              {w.rangliste.titel}
            </h2>
            <p className="max-w-[56ch] text-body text-pretty text-text-muted">{w.rangliste.satz}</p>
          </div>
          <div className="mt-12">
            <Ranglisten texte={w.rangliste} sprache={sprache} />
          </div>
        </section>
      </div>
    </>
  );
}
