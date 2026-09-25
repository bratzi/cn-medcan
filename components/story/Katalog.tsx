import Link from "next/link";
import { Suspense } from "react";

import { ProduktCard } from "@/components/produkt/ProduktCard";
import { KatalogSkelett } from "@/components/story/Skelette";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { leererFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainListe } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";

const ANZAHL = 6;

const EINSTIEGE = [
  { href: "/produkte?typ=INDICA", text: "Indica" },
  { href: "/produkte?typ=SATIVA", text: "Sativa" },
  { href: "/produkte?geschmack=ZITRUS", text: "Zitrus" },
  { href: "/produkte?nurVerfuegbar=1", text: "Nur verfügbare" },
] as const;

/** Sechs Produkte als wischbare Reihe. Preise nur mit Freigabe (bestehende Logik). */
async function Reihe() {
  const liste = await sicher(
    async () => ladeStrainListe(leererFilter(), await istFachkreis()),
    null,
    "Katalog-Reihe",
  );
  if (!liste) {
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        Der Katalog lässt sich gerade nicht laden. Lade die Seite in ein paar Minuten neu, der Rest funktioniert weiter.
      </p>
    );
  }
  // Bewusst in TypeScript zugeschnitten statt mit einer eigenen Abfrage.
  const eintraege = liste.eintraege.slice(0, ANZAHL);

  if (eintraege.length === 0) {
    return (
      // Kasten wie die Leerzustaende der Nachbar-Sektionen, bis Welle 2 den Katalog umbaut.
      <EmptyState
        titel="Keine Blüten im Katalog"
        beschreibung="Derzeit sind keine Handelsnamen hinterlegt."
        className="border border-border bg-surface-raised p-8 sm:p-12"
      />
    );
  }

  return (
    <ul
      aria-label="Auswahl aus dem Katalog"
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8"
    >
      {eintraege.map((strain) => (
        <li key={strain.id} className="flex w-72 shrink-0 snap-start sm:w-88">
          <ProduktCard strain={strain} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Sektion 7 (Spec 5.1): ruhiges Buch nach der Abstimmung. */
export function Katalog() {
  return (
    <section aria-labelledby="katalog-titel" data-story="katalog" className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 id="katalog-titel" className="font-buch text-kapitel text-text">
              Der <em className="farbverlauf hand-betont">Katalog</em>
            </h2>
            <p className="text-body text-text-muted text-pretty">
              Verschreibungspflichtige Cannabisarzneimittel nach ihren BfArM-Handelsnamen, mit
              Cannabinoidgehalt, Terpenprofil und gemeldeter Verfügbarkeit.
            </p>
          </div>
          <Link href="/produkte" className={buttonKlassen("secondary", "md")}>
            Gesamten Katalog ansehen
          </Link>
        </div>

        <ul aria-label="Einstiege in den Katalog" className="flex flex-wrap gap-2">
          {EINSTIEGE.map((eintrag) => (
            <li key={eintrag.href}>
              <Link href={eintrag.href} className={buttonKlassen("secondary", "sm")}>
                {eintrag.text}
              </Link>
            </li>
          ))}
        </ul>

        <Suspense fallback={<KatalogSkelett />}>
          <Reihe />
        </Suspense>
      </div>
    </section>
  );
}
