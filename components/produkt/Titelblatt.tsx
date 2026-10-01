import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { BudpicBeitragen, type BudpicZugang } from "@/components/produkt/BudpicBeitragen";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { Badge } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import type { Darreichungsform, KultivarTyp } from "@/db/enums";
import { formatiereDatum, formatiereProzentSpanne, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { t } from "@/lib/i18n/text";

export type MeineBewertung = { note: number; erstelltAm: Date; chargenNr: string | null };

export type TitelblattProps = {
  handelsname: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  anzahlApothekenVerfuegbar: number;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  /** Neueste eigene Bewertung; null = noch nicht getestet. */
  meineBewertung: MeineBewertung | null;
  /** Referenzbild (Medien-Id) oder null; ein Symbolbild, nicht die echte Sorte. */
  bild?: string | null;
  /** Budpics der Community (T9): Diashow statt Musterbild, dazu "Bild beitragen". */
  budpic?: { strainId: string; slug: string; bilder: readonly DiashowBild[]; zugang: BudpicZugang };
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Titelblatt der Blütenseite (Spec TP2 4.3), ersetzt den Glas-Kopf: Papier
 * statt Glas. Seit 2026-09-25 mit Referenzbild als Symbolbild (Nutzer; Ausnahme
 * zu Leitplanke 5 für die Testphase hinter dem Passwort), kein Reel (es steht bei
 * seiner Bewertung). Drei Schriftgrade (kapitel, h3, small); die Badges
 * haben als Bauteil ihre eigene Groesse.
 */
export function Titelblatt(props: TitelblattProps) {
  return (
    <section
      aria-labelledby="produkt-titel"
      className="grid grid-cols-1 gap-8 border-b-2 border-border-strong pb-12 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h1
          id="produkt-titel"
          className="font-buch text-kapitel text-balance text-text wrap-break-word hyphens-auto"
        >
          {props.handelsname}
        </h1>
        {props.kultivarName ? (
          <p className="font-buch text-h3 font-medium italic text-text">{props.kultivarName}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{props.w.label.kultivarTyp[props.kultivarTyp]}</Badge>
          <Badge variante="neutral">{props.w.label.darreichungsform[props.darreichungsform]}</Badge>
        </div>
        <p className="numeric text-h3 font-normal text-text">
          <span className="whitespace-nowrap">{`THC ${formatiereProzentSpanne(props.thcMin, props.thcMax, 1, props.sprache)}`}</span>
          <span aria-hidden="true">{" · "}</span>
          <span className="sr-only">, </span>
          <span className="whitespace-nowrap">{`CBD ${formatiereProzentSpanne(props.cbdMin, props.cbdMax, 1, props.sprache)}`}</span>
        </p>
      </div>
      {props.budpic && props.budpic.bilder.length > 0 ? (
        <div className="flex w-full max-w-xs flex-col items-end gap-2 justify-self-center lg:w-72">
          <BudpicDiashow bilder={props.budpic.bilder} name={props.handelsname} texte={props.w.budpic} />
          <BudpicBeitragenLeiste props={props} />
        </div>
      ) : props.bild ? (
        <figure title={props.w.budpic.muster} className="flex w-full max-w-xs flex-col items-end gap-2 justify-self-center lg:w-72">
          <Bild id={props.bild} dekorativ sizes="(min-width: 1024px) 288px, 80vw" className="h-auto w-full" />
          <figcaption className="text-caption text-text-muted">{props.w.bluete.titelblatt.symbolbild}</figcaption>
          <BudpicBeitragenLeiste props={props} />
        </figure>
      ) : null}
      <MeineNote bewertung={props.meineBewertung} w={props.w} sprache={props.sprache} />
    </section>
  );
}

/** "Bild beitragen" unter dem Bild; ohne Budpic-Angaben (Tests, Vorschau) entfaellt es. */
function BudpicBeitragenLeiste({ props }: { props: TitelblattProps }) {
  if (!props.budpic) return null;
  return (
    <BudpicBeitragen
      zugang={props.budpic.zugang}
      strainId={props.budpic.strainId}
      slug={props.budpic.slug}
      sprache={props.sprache}
      texte={props.w.budpic}
      meldungen={budpicMeldungen(props.w)}
    />
  );
}

/** "Meine Note" ist die Gesamtnote der neuesten eigenen Bewertung, kein Mittel mit der Community. */
function MeineNote({ bewertung, w, sprache }: { bewertung: MeineBewertung | null; w: Woerterbuch; sprache: Sprache }) {
  const texte = w.bluete.titelblatt;
  if (!bewertung) {
    return (
      <div className="flex flex-col gap-2 lg:items-end lg:text-right">
        <p className="text-h3 font-normal text-text">{texte.nichtGetestet}</p>
        <Link prefetch={false} href="/umfragen" className={einzelLinkKlassen()}>
          {texte.zurAbstimmung}
        </Link>
      </div>
    );
  }

  const datum = formatiereDatum(bewertung.erstelltAm, sprache);
  return (
    <div className="flex flex-col gap-2 lg:items-end lg:text-right">
      <p className="text-small text-text-muted">{texte.unsereNote}</p>
      <p className="numeric text-kapitel font-normal text-text">
        {formatiereZahl(bewertung.note, 1, sprache)}
        <span aria-hidden="true" className="text-h3 text-text-muted">
          {" / 5"}
        </span>
        <span className="sr-only"> {w.bluete.vonFuenf}</span>
      </p>
      <p className="text-small text-text-muted">
        {bewertung.chargenNr
          ? t(texte.bewertetAmCharge, { datum, charge: bewertung.chargenNr })
          : t(texte.bewertetAm, { datum })}
      </p>
    </div>
  );
}
