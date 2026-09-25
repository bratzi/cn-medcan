import Link from "next/link";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type BadgeVariante,
} from "@/components/ui";
import {
  formatiereGramm,
  formatiereLieferzeit,
  formatierePreisProGramm,
  formatiereRelativ,
} from "@/lib/format";
import {
  bestandStatusErlaeuterung,
  bestandStatusLabel,
  rezeptStatusLabel,
} from "@/lib/labels";
import { istBestandStatus, type BestandStatus } from "@/db/enums";
import type { BestandEintrag } from "@/lib/query/strains";
import { textLinkKlassen } from "@/components/ui/textlink";

export type BestandTabelleProps = {
  bestaende: readonly BestandEintrag[];
  /** Steuert, ob die Preisspalte oder der §-10-HWG-Hinweis erscheint. */
  fachkreis: boolean;
};

const STATUS_VARIANTE: Record<BestandStatus, BadgeVariante> = {
  VERFUEGBAR: "success",
  NACHBESTELLT: "warning",
  NICHT_LIEFERBAR: "danger",
  AUSGELISTET: "neutral",
};

/** Bestandszeilen der Apotheken. Server Component, keine Interaktivitaet. */
export function BestandTabelle({ bestaende, fachkreis }: BestandTabelleProps) {
  if (bestaende.length === 0) {
    return (
      <p className="max-w-[68ch] text-body text-text-muted">
        Für diese Blüte liegt derzeit keine Bestandsmeldung einer Apotheke
        vor.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!fachkreis ? (
        <p className="max-w-[68ch] text-small text-text-muted">
          Preise verschreibungspflichtiger Arzneimittel werden nach § 10 HWG nur
          Angehörigen der Fachkreise angezeigt. Die Spalte entfällt daher in
          dieser Ansicht.
        </p>
      ) : null}

      <Table caption="Apotheken mit gemeldetem Bestand zu dieser Blüte">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Apotheke</TableHeaderCell>
            <TableHeaderCell numerisch>Packungsgröße</TableHeaderCell>
            {fachkreis ? (
              <TableHeaderCell numerisch>Preis pro Gramm</TableHeaderCell>
            ) : null}
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Lieferzeit</TableHeaderCell>
            <TableHeaderCell>Rezept</TableHeaderCell>
            <TableHeaderCell>Stand</TableHeaderCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {bestaende.map((bestand) => {
            const status = istBestandStatus(bestand.status)
              ? bestand.status
              : null;

            return (
              <TableRow key={bestand.id}>
                <TableCell>
                  <Link
                    href={`/apotheken/${bestand.apotheke.slug}`}
                    className={textLinkKlassen()}
                  >
                    {bestand.apotheke.name}
                  </Link>
                  <span className="block text-small text-text-muted">
                    {bestand.apotheke.ort}
                  </span>
                </TableCell>

                <TableCell numerisch>
                  {formatiereGramm(bestand.packungGramm)}
                </TableCell>

                {fachkreis ? (
                  <TableCell numerisch>
                    {formatierePreisProGramm(bestand.preisProGrammCent)}
                  </TableCell>
                ) : null}

                <TableCell>
                  {status ? (
                    <Badge
                      variante={STATUS_VARIANTE[status]}
                      title={bestandStatusErlaeuterung[status]}
                    >
                      {bestandStatusLabel[status]}
                    </Badge>
                  ) : (
                    <Badge variante="neutral">Status unbekannt</Badge>
                  )}
                </TableCell>

                <TableCell>
                  {formatiereLieferzeit(
                    bestand.apotheke.lieferzeitTageMin,
                    bestand.apotheke.lieferzeitTageMax,
                  )}
                </TableCell>

                <TableCell>
                  {rezeptStatusLabel[bestand.apotheke.rezeptStatus]}
                  {bestand.apotheke.eRezeptTokenUpload ? (
                    <span className="block text-small text-text-muted">
                      Token-Upload möglich
                    </span>
                  ) : null}
                </TableCell>

                <TableCell>
                  <time dateTime={bestand.standAm.toISOString()}>
                    {formatiereRelativ(bestand.standAm)}
                  </time>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
