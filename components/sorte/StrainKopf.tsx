import type { ReactNode } from "react";

import { Bild } from "@/components/medien/Bild";
import { BudpicBeitragen, type BudpicInsel, type BudpicZugang } from "@/components/produkt/BudpicBeitragen";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Badge, buttonKlassen } from "@/components/ui";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { formatiereProzentSpanne, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { cn } from "@/lib/cn";

export type KopfFakt = { begriff: string; wert: ReactNode };

type Props = {
  name: string;
  /** Kleine Chips unter dem Namen (Typ, Darreichung). */
  chips: readonly string[];
  thc: { min: number; max: number };
  cbd: { min: number; max: number };
  /** Kultivar, Kultivartyp, Vertreiber, Bestrahlung im 2×2-Raster. */
  fakten: readonly KopfFakt[];
  /** Inhalt hinter „Alle Angaben“ (Faktenliste, Wirkstoffe, Terpene). */
  alleAngaben: ReactNode;
  note: number | null;
  anzahl: number;
  bild: string | null;
  budpic: { strainId: string; slug: string; kultivarSlug: string; bilder: readonly DiashowBild[]; zugang: BudpicZugang; insel: BudpicInsel };
  /** Herz der Blüte unter der Note. */
  like: ReactNode;
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Kopf der Strain-Seite als eine Sektion (Nutzer 2026-10-22, Prototyp freigegeben): links Name, Chips,
 * Wirkstoffe, Linie, die vier Kernangaben im 2×2-Raster und „Alle Angaben“ zum Aufklappen; rechts oben auf
 * Höhe der H1 das Bild mit der Pille „Bild beitragen“, darunter die Note groß in der Handschrift.
 * Der Name steht nur einmal. Statisch, ohne JavaScript lesbar (<details>).
 */
export function StrainKopf(p: Props) {
  const texte = p.w.bluete;
  return (
    <section
      aria-labelledby="produkt-titel"
      className="grid grid-cols-1 gap-12 border-b-2 border-border-strong pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start lg:gap-16"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 id="produkt-titel" className="font-buch text-kapitel text-balance text-text wrap-break-word hyphens-auto">
            {p.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {p.chips.map((chip) => (
              <Badge key={chip} variante="neutral">
                {chip}
              </Badge>
            ))}
          </div>
          <p className="numeric text-h3 font-normal text-text">
            <span className="whitespace-nowrap">{`THC ${formatiereProzentSpanne(p.thc.min, p.thc.max, 1, p.sprache)}`}</span>
            <span aria-hidden="true" className="text-text-muted">
              {" · "}
            </span>
            <span className="sr-only">, </span>
            <span className="whitespace-nowrap">{`CBD ${formatiereProzentSpanne(p.cbd.min, p.cbd.max, 1, p.sprache)}`}</span>
          </p>
        </div>

        <hr className="border-border" />

        <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
          {p.fakten.map((fakt) => (
            <div key={fakt.begriff} className="flex min-w-0 flex-col gap-1">
              <dt className="text-small text-text-muted">{fakt.begriff}</dt>
              <dd className="font-buch text-h3 text-text text-balance wrap-break-word">{fakt.wert}</dd>
            </div>
          ))}
        </dl>

        <details className="group">
          <summary className={buttonKlassen("secondary", "md", "w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
            <span className="group-open:hidden">{texte.alleAngaben}</span>
            <span className="hidden group-open:inline">{texte.wenigerAngaben}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 transition-transform duration-normal ease-standard group-open:rotate-180">
              <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="mt-8">{p.alleAngaben}</div>
        </details>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-8 justify-self-center lg:max-w-none lg:justify-self-stretch">
        <div className="flex w-full flex-col items-center gap-4">
          {p.budpic.bilder.length > 0 ? (
            <BudpicDiashow bilder={p.budpic.bilder} name={p.name} texte={p.w.budpic} />
          ) : p.bild ? (
            <figure title={p.w.budpic.muster} className="flex w-full flex-col items-center gap-2">
              <Bild id={p.bild} dekorativ sizes="(min-width: 1024px) 320px, 80vw" className="h-auto w-full" />
              <figcaption className="text-caption text-text-muted">{texte.titelblatt.symbolbild}</figcaption>
            </figure>
          ) : null}
          <BudpicBeitragen
            zugang={p.budpic.zugang}
            strainId={p.budpic.strainId}
            slug={p.budpic.slug}
            kultivarSlug={p.budpic.kultivarSlug}
            insel={p.budpic.insel}
            sprache={p.sprache}
            texte={p.w.budpic}
            meldungen={budpicMeldungen(p.w)}
          />
        </div>

        {/* Note in der Handschrift, Zahl groß, „/ 5“ klein gedruckt (Akzent aufs kurze Element). */}
        <div className="flex flex-col items-center gap-2 text-center">
          {p.note !== null && p.anzahl > 0 ? (
            <>
              <p className="flex items-baseline gap-2">
                <span className="font-hand text-urteil text-logo">{formatiereZahl(p.note, 1, p.sprache)}</span>
                <span aria-hidden="true" className="font-buch text-h3 text-text-muted">
                  {texte.vonFuenfKurz}
                </span>
                <span className="sr-only">{texte.vonFuenf}</span>
              </p>
              <BlattAnzeige note={p.note} text={t(texte.sorte.hauptnote, { note: formatiereZahl(p.note, 1, p.sprache) })} />
              <p className={cn("numeric text-small text-text-muted")}>{mehrzahl(p.sprache, texte.sorte.anzahl, p.anzahl)}</p>
            </>
          ) : (
            <p className="text-small text-text-muted">{texte.sorte.ohneNote}</p>
          )}
          {p.like}
        </div>
      </div>
    </section>
  );
}
