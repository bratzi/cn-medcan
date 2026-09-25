import Link from "next/link";

import { Badge, Card, CardBody, CardFooter } from "@/components/ui";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { cn } from "@/lib/cn";
import { formatierePreisProGramm } from "@/lib/format";
import { darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";
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
  const verfuegbar = strain.anzahlApothekenVerfuegbar > 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-h3 text-text">
              <Link
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

          <Badge variante={verfuegbar ? "success" : "neutral"}>
            {verfuegbar
              ? `${strain.anzahlApothekenVerfuegbar} Apotheke${strain.anzahlApothekenVerfuegbar === 1 ? "" : "n"}`
              : "Bestand unbekannt"}
          </Badge>
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
        <span className="text-body font-medium text-text">
          {strain.preisNurFuerFachkreise && strain.guenstigsterPreisCent === null
            ? "Preis nur für Fachkreise"
            : formatierePreisProGramm(strain.guenstigsterPreisCent)}
        </span>
      </CardFooter>
    </Card>
  );
}
