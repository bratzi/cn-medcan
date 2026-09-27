import Link from "next/link";
import { Suspense } from "react";

import { ProduktCard } from "@/components/produkt/ProduktCard";
import { KatalogSkelett } from "@/components/story/Skelette";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { leererFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainListe } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { holeSprache, holeWoerterbuch, type Woerterbuch } from "@/lib/i18n";

const ANZAHL = 6;

const EINSTIEGE = [
  { href: "/blueten?typ=INDICA", text: (w: Woerterbuch) => w.label.kultivarTyp.INDICA },
  { href: "/blueten?typ=SATIVA", text: (w: Woerterbuch) => w.label.kultivarTyp.SATIVA },
  { href: "/blueten?geschmack=ZITRUS", text: (w: Woerterbuch) => w.label.geschmack.ZITRUS },
  { href: "/blueten?nurVerfuegbar=1", text: (w: Woerterbuch) => w.start.katalog.nurVerfuegbar },
] as const;

/** Sechs Produkte als wischbare Reihe. Preise nur mit Freigabe (bestehende Logik). */
async function Reihe() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const liste = await sicher(
    async () => ladeStrainListe(leererFilter(), await istFachkreis()),
    null,
    "Katalog-Reihe",
  );
  if (!liste) {
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        {w.start.katalog.fehler}
      </p>
    );
  }
  // Bewusst in TypeScript zugeschnitten statt mit einer eigenen Abfrage.
  const eintraege = liste.eintraege.slice(0, ANZAHL);

  if (eintraege.length === 0) {
    return (
      // Kasten wie die Leerzustaende der Nachbar-Sektionen, bis Welle 2 den Katalog umbaut.
      <EmptyState
        titel={w.start.katalog.leerTitel}
        beschreibung={w.start.katalog.leerText}
        className="border border-border bg-surface-raised p-8 sm:p-12"
      />
    );
  }

  return (
    <ul
      aria-label={w.start.katalog.auswahl}
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8"
    >
      {eintraege.map((strain) => (
        <li key={strain.id} className="flex w-72 shrink-0 snap-start sm:w-88">
          <ProduktCard strain={strain} w={w} sprache={sprache} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Sektion 7 (Spec 5.1): ruhiges Buch nach der Abstimmung. */
export async function Katalog() {
  const w = await holeWoerterbuch();
  const texte = w.start.katalog;
  return (
    <section aria-labelledby="katalog-titel" data-story="katalog" className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 id="katalog-titel" className="font-buch text-kapitel text-text">
              {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
            </h2>
            <p className="text-body text-text-muted text-pretty">
              {texte.text}
            </p>
          </div>
          <Link href="/blueten" className={buttonKlassen("secondary", "md")}>
            {texte.ganzerKatalog}
          </Link>
        </div>

        <ul aria-label={texte.einstiege} className="flex flex-wrap gap-2">
          {EINSTIEGE.map((eintrag) => (
            <li key={eintrag.href}>
              <Link href={eintrag.href} className={buttonKlassen("secondary", "sm")}>
                {eintrag.text(w)}
              </Link>
            </li>
          ))}
        </ul>

        <Suspense fallback={<KatalogSkelett ansage={w.katalog.laedt} />}>
          <Reihe />
        </Suspense>
      </div>
    </section>
  );
}
