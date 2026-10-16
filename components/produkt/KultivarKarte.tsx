import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Badge } from "@/components/ui";
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

/** Bildfläche: in jeder Karte gleich hoch, damit das Raster ruhig steht, auch ohne Bild. */
const BILDFLAECHE = "aspect-4/3 w-full";

/**
 * Karte je Blüte (Spec 2.3). Reihenfolge nach Wichtigkeit: Bild, Name, Vertreiber-Zahl, Typ und
 * THC-Spanne, Vertreiber, Bewertungsstand und der Weg zu den Handelsnamen im Fuß.
 * Die ganze Karte ist ein Ziel: der Name trägt den Link (Sortenseite, sonst die Handelsnamen der
 * Blüte) und spannt ihn per `after:` über die Fläche. Diashow-Knöpfe und der Fuß-Link liegen
 * darüber (`relative z-10`), damit sie eigene Ziele bleiben.
 * Bewegung nur Farbe (Rahmen, Name); globale Regel schaltet sie bei reduzierter Bewegung ab.
 */
export function KultivarKarte({ kultivar, filter, w, sprache, budpics = [] }: Props) {
  const texte = w.katalog.kultivar;
  const sichtbar = kultivar.vertreiber.slice(0, VERTREIBER_MAX);
  const rest = kultivar.vertreiber.length - sichtbar.length;
  const ziel = `/blueten?${serialisiereFilter({ ...filter, kultivar: kultivar.id, ansicht: "ware", seite: 1 }).toString()}`;
  const hauptziel = kultivar.slug ? `/blueten/${kultivar.slug}` : ziel;
  const bild = blueteBild(kultivar.herstellerBildPfad) ?? (kultivar.bildSlug ? musterBildId(kultivar.bildSlug) : null);
  const thc =
    kultivar.thcMin !== null && kultivar.thcMax !== null
      ? (() => {
          const s = formatiereZahlSpanne(kultivar.thcMin, kultivar.thcMax, 0, sprache);
          return s.gleich ? t(texte.thcEinzeln, { wert: s.von }) : t(texte.thc, { von: s.von, bis: s.bis });
        })()
      : null;
  const cbd =
    kultivar.cbdMin !== null && kultivar.cbdMax !== null
      ? (() => {
          const s = formatiereZahlSpanne(kultivar.cbdMin, kultivar.cbdMax, 1, sprache);
          return s.gleich ? t(texte.cbdEinzeln, { wert: s.von }) : t(texte.cbd, { von: s.von, bis: s.bis });
        })()
      : null;

  return (
    <article className="group relative flex w-full flex-col rounded-lg border border-border bg-surface transition-colors duration-fast ease-standard focus-within:border-border-strong hover:border-border-strong">
      {budpics.length > 0 ? (
        <div className="relative z-10 p-4">
          <BudpicDiashow bilder={budpics} name={kultivar.name} texte={w.budpic} rahmen={BILDFLAECHE} einpassen />
        </div>
      ) : (
        <div className="p-4">
          {bild ? (
            // Referenzbild, als Symbolbild gekennzeichnet; ganz im Rahmen, nie beschnitten.
            <figure title={w.budpic.muster} className="flex flex-col gap-2">
              <div className={`flex items-center justify-center overflow-hidden bg-surface-sunken p-4 ${BILDFLAECHE}`}>
                <Bild
                  id={bild}
                  dekorativ
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="h-full! min-h-0 w-full object-contain"
                />
              </div>
              <figcaption className="text-caption text-text-muted">{w.katalog.karte.symbolbild}</figcaption>
            </figure>
          ) : (
            <div aria-hidden="true" className={`bg-surface-sunken ${BILDFLAECHE}`} />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-buch text-h3 text-balance text-text wrap-break-word">
            <Link
              prefetch={false}
              href={hauptziel}
              className="rounded-sm transition-colors duration-fast ease-standard group-hover:text-accent after:absolute after:inset-0 after:content-['']"
            >
              {kultivar.name}
            </Link>
          </h3>
          {sichtbar.length > 0 ? (
            <p className="text-small text-text-muted">{mehrzahl(sprache, texte.vertreiber, kultivar.vertreiber.length)}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Badge variante="neutral">{w.label.kultivarTyp[kultivar.typ]}</Badge>
          {thc ? <span className="numeric text-small text-text">{thc}</span> : null}
          {cbd ? <span className="numeric text-small text-text-muted">{cbd}</span> : null}
        </div>

        {kultivar.terpene.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="sr-only">{texte.terpene}</p>
            <TerpenChips terpene={kultivar.terpene} w={w} sprache={sprache} />
          </div>
        ) : null}

        {sichtbar.length > 0 ? (
          <ul className="flex flex-wrap gap-x-2 gap-y-2 text-small text-text">
            {sichtbar.map((name, i) => (
              <li key={name} className="wrap-break-word">
                {name}
                {i < sichtbar.length - 1 || rest > 0 ? <span aria-hidden="true" className="text-text-muted">,</span> : null}
              </li>
            ))}
            {rest > 0 ? <li className="numeric text-text-muted">{t(texte.mehrVertreiber, { anzahl: rest })}</li> : null}
          </ul>
        ) : (
          <p className="text-small text-text-muted">{texte.vertreiberUnbekannt}</p>
        )}

        <div className="mt-auto flex flex-col gap-4 border-t border-border pt-4">
          {kultivar.overall !== null ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <BlattAnzeige note={kultivar.overall} text={t(texte.overall, { note: formatiereZahl(kultivar.overall, 1, sprache) })} />
              <span className="numeric text-small text-text-muted">{mehrzahl(sprache, texte.bewertungen, kultivar.bewertungen)}</span>
            </div>
          ) : (
            <p className="text-small text-text-muted">{texte.keineBewertung}</p>
          )}
          {kultivar.slug ? (
            <p className="relative z-10">
              <Link prefetch={false} href={ziel} className={einzelLinkKlassen()}>
                {mehrzahl(sprache, texte.handelsnamen, kultivar.handelsnamen)}
              </Link>
            </p>
          ) : (
            <p className="text-small text-accent" aria-hidden="true">
              {mehrzahl(sprache, texte.handelsnamen, kultivar.handelsnamen)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
