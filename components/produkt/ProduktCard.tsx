import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { Badge, Card, CardBody, CardFooter } from "@/components/ui";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { cn } from "@/lib/cn";
import { darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";
import { blueteBild } from "@/lib/medien";
import type { StrainListenEintrag } from "@/lib/query/strains";

type Props = {
  strain: StrainListenEintrag;
  className?: string;
};

/**
 * Produktkarte der Uebersicht. Server Component - keine Interaktivitaet
 * ausser dem umschliessenden Link.
 */
export function ProduktCard({ strain, className }: Props) {
  // Apotheken und Preise seit 2026-09-25 nur in Aussicht (Nutzer): keine Badges, kein Preis.
  const bild = blueteBild(strain.herstellerBildPfad);

  return (
    <Card className={cn("flex flex-col", className)}>
      {bild ? (
        // Referenzbild (Nutzer 2026-09-25): nicht die echte Sorte, deshalb als Symbolbild gekennzeichnet.
        // Feste Höhe (Nutzer 2026-09-25): ein Bild mit großem Eigenformat verzog sonst die Kachelreihe.
        <figure className="relative flex h-56 items-center justify-center overflow-hidden px-8 pt-8 pb-6">
          {/* Bild führt auch zur Sorte (Nutzer 2026-09-26); für Tastatur und Screenreader
              reicht der Link am Namen, daher hier ohne Tabstopp. */}
          <Link prefetch={false} href={`/produkte/${strain.slug}`} tabIndex={-1} aria-hidden="true" className="flex h-full w-full items-center justify-center">
            <Bild
              id={bild}
              dekorativ
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="h-full! min-h-0 w-full object-contain"
            />
          </Link>
          <figcaption className="absolute right-4 bottom-2 text-caption text-text-muted">Symbolbild</figcaption>
        </figure>
      ) : null}
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-h3 text-text">
              <Link
                prefetch={false}
                href={`/produkte/${strain.slug}`}
                className="rounded-sm hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
          <Badge variante="neutral">{kultivarTypLabel[strain.kultivarTyp]}</Badge>
          <Badge variante="neutral">{darreichungsformLabel[strain.darreichungsform]}</Badge>
          {strain.anbauland ? <Badge variante="neutral">{strain.anbauland}</Badge> : null}
        </div>

        <CannabinoidBar
          thcMin={strain.thcMinProzent}
          thcMax={strain.thcMaxProzent}
          cbdMin={strain.cbdMinProzent}
          cbdMax={strain.cbdMaxProzent}
        />

        {strain.terpene.length > 0 ? <TerpenChips terpene={strain.terpene} /> : null}
      </CardBody>

      <CardFooter className="flex items-baseline justify-between gap-4">
        <span className="text-small text-text-muted">
          {strain.herstellerName ?? "Hersteller unbekannt"}
        </span>
      </CardFooter>
    </Card>
  );
}
