import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { Badge, Card, CardBody, CardFooter } from "@/components/ui";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { BudpicBeitragen, type BudpicZugang } from "@/components/produkt/BudpicBeitragen";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { musterBildId } from "@/lib/budpics";
import { blueteBild } from "@/lib/medien";
import type { StrainListenEintrag } from "@/lib/query/strains";

type Props = {
  strain: StrainListenEintrag;
  w: Woerterbuch;
  sprache: Sprache;
  className?: string;
  /** Freigegebene Budpics dieser Sorte (fertig fuer die Diashow); leer: Musterbild. */
  budpics?: readonly DiashowBild[];
  /** Wer schaut, fuer "Bild beitragen". */
  zugang?: BudpicZugang;
};

/**
 * Produktkarte der Uebersicht. Server Component - keine Interaktivitaet
 * ausser dem umschliessenden Link.
 */
export function ProduktCard({ strain, w, sprache, className, budpics = [], zugang = "gast" }: Props) {
  // Apotheken und Preise seit 2026-09-25 nur in Aussicht (Nutzer): keine Badges, kein Preis.
  // Ohne echtes Bild ein Musterbild: das gesetzte, sonst eines je Sorte stabil ueber den Slug (T9).
  const bild = blueteBild(strain.herstellerBildPfad) ?? musterBildId(strain.slug);

  return (
    <Card className={cn("flex flex-col", className)}>
      {budpics.length > 0 ? (
        // Echte Bilder der Community (T9): Diashow statt Musterbild. Bewusst ausserhalb des
        // Links, weil sie eigene Knoepfe hat; der Link am Namen fuehrt zur Sorte.
        <div className="px-8 pt-8 pb-2">
          <BudpicDiashow bilder={budpics} name={strain.handelsname} texte={w.budpic} rahmen="h-56 w-full" />
        </div>
      ) : bild ? (
        // Referenzbild (Nutzer 2026-09-25): nicht die echte Sorte, deshalb als Symbolbild gekennzeichnet.
        // Feste Höhe (Nutzer 2026-09-25): ein Bild mit großem Eigenformat verzog sonst die Kachelreihe.
        <figure title={w.budpic.muster} className="relative flex h-56 items-center justify-center overflow-hidden px-8 pt-8 pb-6">
          {/* Bild führt auch zur Sorte (Nutzer 2026-09-26); für Tastatur und Screenreader
              reicht der Link am Namen, daher hier ohne Tabstopp. */}
          <Link prefetch={false} href={`/blueten/${strain.slug}`} tabIndex={-1} aria-hidden="true" className="flex h-full w-full items-center justify-center">
            <Bild
              id={bild}
              dekorativ
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="h-full! min-h-0 w-full object-contain"
            />
          </Link>
          <figcaption className="absolute right-4 bottom-2 text-caption text-text-muted">{w.katalog.karte.symbolbild}</figcaption>
        </figure>
      ) : null}
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-h3 text-text">
              <Link
                prefetch={false}
                href={`/blueten/${strain.slug}`}
                className="hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {strain.handelsname}
              </Link>
            </h3>
            {strain.kultivarName ? (
              <p className="mt-1 text-small text-text-muted">{strain.kultivarName}</p>
            ) : null}
          </div>

        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{w.label.kultivarTyp[strain.kultivarTyp]}</Badge>
          <Badge variante="neutral">{w.label.darreichungsform[strain.darreichungsform]}</Badge>
          {strain.anbauland ? <Badge variante="neutral">{strain.anbauland}</Badge> : null}
        </div>

        <CannabinoidBar
          thcMin={strain.thcMinProzent}
          thcMax={strain.thcMaxProzent}
          cbdMin={strain.cbdMinProzent}
          cbdMax={strain.cbdMaxProzent}
          w={w}
          sprache={sprache}
        />

        {strain.terpene.length > 0 ? <TerpenChips terpene={strain.terpene} w={w} sprache={sprache} /> : null}
      </CardBody>

      <CardFooter className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-small text-text-muted">
          {strain.herstellerName ?? w.katalog.karte.herstellerUnbekannt}
        </span>
        <BudpicBeitragen
          zugang={zugang}
          strainId={strain.id}
          slug={strain.slug}
          sprache={sprache}
          texte={w.budpic}
          meldungen={budpicMeldungen(w)}
          kompakt
        />
      </CardFooter>
    </Card>
  );
}
