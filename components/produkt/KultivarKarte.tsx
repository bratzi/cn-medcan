import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Badge, Card, CardBody } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { serialisiereFilter, type StrainFilter } from "@/lib/query/filter";
import type { KultivarListenEintrag } from "@/lib/query/kultivar-liste";

const VERTREIBER_MAX = 5;

type Props = { kultivar: KultivarListenEintrag; filter: StrainFilter; w: Woerterbuch; sprache: Sprache };

/** Karte je Blüte (Spec 2.3), ohne Bild: es gibt kein Bild je Kultivar. */
export function KultivarKarte({ kultivar, filter, w, sprache }: Props) {
  const texte = w.katalog.kultivar;
  const sichtbar = kultivar.vertreiber.slice(0, VERTREIBER_MAX);
  const rest = kultivar.vertreiber.length - sichtbar.length;
  const ziel = serialisiereFilter({ ...filter, kultivar: kultivar.id, ansicht: "ware", seite: 1 }).toString();
  return (
    <Card className="flex w-full flex-col">
      <CardBody className="flex flex-1 flex-col gap-4">
        <h3 className="font-buch text-h3 text-text wrap-break-word">{kultivar.name}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{w.label.kultivarTyp[kultivar.typ]}</Badge>
        </div>
        {kultivar.thcMin !== null && kultivar.thcMax !== null ? (
          <p className="numeric text-small text-text">
            {t(texte.thc, { von: formatiereZahl(kultivar.thcMin, 0, sprache), bis: formatiereZahl(kultivar.thcMax, 0, sprache) })}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {sichtbar.length > 0 ? (
            <>
              <p className="text-small text-text-muted">{mehrzahl(sprache, texte.vertreiber, kultivar.vertreiber.length)}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small text-text">
                {sichtbar.map((name) => (
                  <li key={name} className="wrap-break-word">{name}</li>
                ))}
                {rest > 0 ? <li className="text-text-muted">{t(texte.mehrVertreiber, { anzahl: rest })}</li> : null}
              </ul>
            </>
          ) : (
            <p className="text-small text-text-muted">{texte.vertreiberUnbekannt}</p>
          )}
        </div>
        {kultivar.overall !== null ? (
          <div className="flex flex-col gap-2">
            <BlattAnzeige note={kultivar.overall} text={t(texte.overall, { note: formatiereZahl(kultivar.overall, 1, sprache) })} />
            <span className="text-small text-text-muted numeric">{mehrzahl(sprache, texte.bewertungen, kultivar.bewertungen)}</span>
          </div>
        ) : null}
        <p className="mt-auto">
          <Link prefetch={false} href={`/blueten?${ziel}`} className={einzelLinkKlassen()}>
            {mehrzahl(sprache, texte.handelsnamen, kultivar.handelsnamen)}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
