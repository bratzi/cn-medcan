import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Badge, Card, CardBody } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { musterBildId } from "@/lib/budpics";
import { formatiereZahl, formatiereZahlSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { serialisiereFilter, type StrainFilter } from "@/lib/query/filter";
import { blueteBild } from "@/lib/medien";
import type { KultivarListenEintrag } from "@/lib/query/kultivar-liste";

const VERTREIBER_MAX = 5;

type Props = {
  kultivar: KultivarListenEintrag;
  filter: StrainFilter;
  w: Woerterbuch;
  sprache: Sprache;
  /** Freigegebene Budpics aller Handelsnamen dieser Blüte; leer: Musterbild wie auf der Handelsnamen-Karte. */
  budpics?: readonly DiashowBild[];
};

/**
 * Karte je Blüte (Spec 2.3). Bild wie auf der Handelsnamen-Karte: Budpics der Blüte, sonst das
 * Musterbild des ersten Handelsnamens, immer ganz im festen Rahmen. Der Name führt auf die Sortenseite.
 */
export function KultivarKarte({ kultivar, filter, w, sprache, budpics = [] }: Props) {
  const texte = w.katalog.kultivar;
  const sichtbar = kultivar.vertreiber.slice(0, VERTREIBER_MAX);
  const rest = kultivar.vertreiber.length - sichtbar.length;
  const ziel = serialisiereFilter({ ...filter, kultivar: kultivar.id, ansicht: "ware", seite: 1 }).toString();
  const bild = blueteBild(kultivar.herstellerBildPfad) ?? (kultivar.bildSlug ? musterBildId(kultivar.bildSlug) : null);
  return (
    <Card className="flex w-full flex-col">
      {budpics.length > 0 ? (
        <div className="px-8 pt-8 pb-2">
          <BudpicDiashow bilder={budpics} name={kultivar.name} texte={w.budpic} rahmen="h-56 w-full" einpassen />
        </div>
      ) : bild ? (
        // Referenzbild, als Symbolbild gekennzeichnet; feste Höhe, das Bild passt sich ein.
        <figure title={w.budpic.muster} className="relative flex h-56 items-center justify-center overflow-hidden px-8 pt-8 pb-6">
          <Bild
            id={bild}
            dekorativ
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="h-full! min-h-0 w-full object-contain"
          />
          <figcaption className="absolute right-4 bottom-2 text-caption text-text-muted">{w.katalog.karte.symbolbild}</figcaption>
        </figure>
      ) : null}
      <CardBody className="flex flex-1 flex-col gap-4">
        <h3 className="font-buch text-h3 text-text wrap-break-word">
          {kultivar.slug ? (
            <Link prefetch={false} href={`/blueten/${kultivar.slug}`} className={einzelLinkKlassen()}>
              {kultivar.name}
            </Link>
          ) : (
            kultivar.name
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{w.label.kultivarTyp[kultivar.typ]}</Badge>
        </div>
        {kultivar.thcMin !== null && kultivar.thcMax !== null ? (
          <p className="numeric text-small text-text">
            {(() => {
              const s = formatiereZahlSpanne(kultivar.thcMin, kultivar.thcMax, 0, sprache);
              return s.gleich ? t(texte.thcEinzeln, { wert: s.von }) : t(texte.thc, { von: s.von, bis: s.bis });
            })()}
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
