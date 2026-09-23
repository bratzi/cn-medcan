import Link from "next/link";

import { InstagramEmbed } from "@/components/produkt/InstagramEmbed";
import { Badge, Card, CardBody, CardHeader, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent } from "@/lib/format";
import {
  BEWERTUNGS_ACHSEN,
  berechneGesamtnote,
  bewerteFeuchtigkeit,
  type FeuchtigkeitsEinordnung,
} from "@/lib/query/bewertung";
import type { RedaktionelleReview } from "@/lib/query/reviews";
import type { BadgeVariante } from "@/components/ui";

const NOTE_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const NOTEN_MAX = 5;

const FEUCHTIGKEIT_VARIANTE: Record<FeuchtigkeitsEinordnung, BadgeVariante> = {
  optimal: "success",
  zu_trocken: "warning",
  zu_feucht: "danger",
  unbekannt: "neutral",
};

const FEUCHTIGKEIT_LABEL: Record<FeuchtigkeitsEinordnung, string> = {
  optimal: "Restfeuchte optimal",
  zu_trocken: "Zu trocken",
  zu_feucht: "Zu feucht",
  unbekannt: "Restfeuchte unbekannt",
};

type Props = {
  review: RedaktionelleReview;
  className?: string;
};

/** Eine Notenzeile: der Balken ist Redundanz, die Zahl steht immer als Text. */
function Notenzeile({ label, wert }: { label: string; wert: number }) {
  const anteil = Math.min(Math.max(wert / NOTEN_MAX, 0), 1) * 100;

  return (
    <div className="flex items-center gap-4">
      <span className="w-24 shrink-0 text-small text-text-muted">{label}</span>
      <span
        aria-hidden="true"
        className="flex h-2 grow overflow-hidden rounded-sm bg-surface-sunken"
      >
        <span className="block h-full rounded-sm bg-accent" style={{ width: `${anteil}%` }} />
      </span>
      <span className="numeric w-16 shrink-0 text-right text-small text-text">
        {`${NOTE_FORMATTER.format(wert)}/${NOTE_FORMATTER.format(NOTEN_MAX)}`}
      </span>
    </div>
  );
}

/**
 * Eine Bewertung des Betreibers - auf der Startseite die neueste, auf
 * /reviews jede.
 *
 * Bewusst eine eigene Komponente statt `BewertungsListe`: die Liste zeigt
 * Bewertungen *zu einem Produkt* und nennt das Produkt deshalb nicht. Hier
 * ist der Handelsname die Hauptaussage.
 */
export function ReviewKarte({ review, className }: Props) {
  const gesamtnote = berechneGesamtnote(review);
  const feuchtigkeit = bewerteFeuchtigkeit(review.feuchtigkeitProzent).einordnung;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <Badge variante="accent">Bewertung des Betreibers</Badge>
        <time dateTime={review.erstelltAm.toISOString()} className="text-small text-text-muted">
          {formatiereDatum(review.erstelltAm)}
        </time>
      </CardHeader>

      <CardBody className="flex grow flex-col">
        <h3 className="text-h3 text-text" title={review.handelsname}>
          <Link href={`/produkte/${review.slug}`} className="underline underline-offset-2">
            {review.handelsname}
          </Link>
        </h3>

        <p className="numeric mt-2 text-small text-text-muted">
          {`Gesamtnote ${NOTE_FORMATTER.format(gesamtnote)}/${NOTE_FORMATTER.format(NOTEN_MAX)}`}
          {review.chargenNr ? ` · Charge ${review.chargenNr}` : null}
        </p>

        <InstagramEmbed
          url={review.instagramReelUrl}
          bezeichnung={review.handelsname}
          className="mt-6"
        />

        <div className="mt-6 flex flex-col gap-2">
          {BEWERTUNGS_ACHSEN.map((achse) => (
            <Notenzeile key={achse.key} label={achse.label} wert={review[achse.key]} />
          ))}
        </div>

        <p className="mt-6">
          <Badge variante={FEUCHTIGKEIT_VARIANTE[feuchtigkeit]}>
            {feuchtigkeit === "unbekannt"
              ? FEUCHTIGKEIT_LABEL[feuchtigkeit]
              : `${FEUCHTIGKEIT_LABEL[feuchtigkeit]} · ${formatiereProzent(review.feuchtigkeitProzent)}`}
          </Badge>
        </p>

        {review.notiz ? (
          <p className="mt-6 max-w-[68ch] text-body text-text-muted">{review.notiz}</p>
        ) : null}

        <p className="mt-8">
          <Link
            href={`/produkte/${review.slug}`}
            className={buttonKlassen("secondary", "sm")}
          >
            Produkt und alle Bewertungen ansehen
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
