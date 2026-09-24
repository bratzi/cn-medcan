import Link from "next/link";

import { Badge } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import type { Darreichungsform, KultivarTyp } from "@/db/enums";
import { formatiereDatum, formatiereProzentSpanne } from "@/lib/format";
import { darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

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
};

function verfuegbarkeit(anzahl: number): string {
  if (anzahl === 0) return "Derzeit nicht lieferbar";
  if (anzahl === 1) return "Bei 1 Apotheke verfügbar";
  return `Bei ${anzahl} Apotheken verfügbar`;
}

/**
 * Titelblatt der Produktseite (Spec TP2 4.3), ersetzt den Glas-Kopf: Papier
 * statt Glas, kein Herstellerbild (Leitplanke 5), kein Reel (es steht bei
 * seiner Bewertung). Drei Schriftgrade (kapitel, h3, small); die Badges
 * haben als Bauteil ihre eigene Groesse.
 */
export function Titelblatt(props: TitelblattProps) {
  return (
    <section
      aria-labelledby="produkt-titel"
      className="grid grid-cols-1 gap-8 border-b-2 border-border-strong pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
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
          <Badge variante="neutral">{kultivarTypLabel[props.kultivarTyp]}</Badge>
          <Badge variante="neutral">{darreichungsformLabel[props.darreichungsform]}</Badge>
          <Badge variante={props.anzahlApothekenVerfuegbar > 0 ? "success" : "danger"}>
            {verfuegbarkeit(props.anzahlApothekenVerfuegbar)}
          </Badge>
        </div>
        <p className="numeric text-h3 font-normal text-text">
          <span className="whitespace-nowrap">{`THC ${formatiereProzentSpanne(props.thcMin, props.thcMax)}`}</span>
          <span aria-hidden="true">{" · "}</span>
          <span className="sr-only">, </span>
          <span className="whitespace-nowrap">{`CBD ${formatiereProzentSpanne(props.cbdMin, props.cbdMax)}`}</span>
        </p>
      </div>
      <MeineNote bewertung={props.meineBewertung} />
    </section>
  );
}

/** "Meine Note" ist die Gesamtnote der neuesten eigenen Bewertung, kein Mittel mit der Community. */
function MeineNote({ bewertung }: { bewertung: MeineBewertung | null }) {
  if (!bewertung) {
    return (
      <div className="flex flex-col gap-2 lg:items-end lg:text-right">
        <p className="text-h3 font-normal text-text">Noch nicht von mir getestet.</p>
        <Link href="/umfragen" className={einzelLinkKlassen()}>
          Zur Abstimmung
        </Link>
      </div>
    );
  }

  const datum = formatiereDatum(bewertung.erstelltAm);
  return (
    <div className="flex flex-col gap-2 lg:items-end lg:text-right">
      <p className="text-small text-text-muted">Meine Note</p>
      <p className="numeric text-kapitel font-normal text-text">
        {NOTE.format(bewertung.note)}
        <span aria-hidden="true" className="text-h3 text-text-muted">
          {" / 5"}
        </span>
        <span className="sr-only"> von 5</span>
      </p>
      <p className="text-small text-text-muted">
        {bewertung.chargenNr ? `Bewertet am ${datum}, Charge ${bewertung.chargenNr}` : `Bewertet am ${datum}`}
      </p>
    </div>
  );
}
