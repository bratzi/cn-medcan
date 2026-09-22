import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent } from "@/lib/format";
import {
  BEWERTUNGS_ACHSEN,
  berechneGesamtnote,
  bewerteFeuchtigkeit,
  type FeuchtigkeitsEinordnung,
} from "@/lib/query/bewertung";
import { baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import type { ReviewEintrag } from "@/lib/query/strains";
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

export type BewertungsListeProps = {
  reviews: readonly ReviewEintrag[];
  className?: string;
};

/** Eine Notenzeile: Balken als Redundanz, die Zahl steht immer als Text. */
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

/** Einzelbewertungen zu einem Produkt. Server Component. */
export function BewertungsListe({ reviews, className }: BewertungsListeProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        className={className}
        titel="Keine Einzelbewertungen"
        beschreibung="Es liegen noch keine freigegebenen Bewertungen zu diesem Produkt vor."
      />
    );
  }

  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {reviews.map((review) => {
        const gesamtnote = berechneGesamtnote(review);
        const feuchtigkeit = bewerteFeuchtigkeit(review.feuchtigkeitProzent);
        const reelUrl = baueEmbedUrl(review.instagramReelUrl) ? review.instagramReelUrl : null;

        return (
          <li key={review.id}>
            <Card>
              <CardHeader className="flex flex-wrap items-baseline justify-between gap-4">
                <p className="text-h3 text-text">
                  <span className="numeric">{NOTE_FORMATTER.format(gesamtnote)}</span>
                  <span>{` von ${NOTE_FORMATTER.format(NOTEN_MAX)}`}</span>
                </p>
                <p className="text-small text-text-muted">
                  <time dateTime={review.erstelltAm.toISOString()}>
                    {formatiereDatum(review.erstelltAm)}
                  </time>
                  {review.chargenNr ? (
                    <span>{` · Charge ${review.chargenNr}`}</span>
                  ) : (
                    <span> · Charge nicht angegeben</span>
                  )}
                </p>
              </CardHeader>

              <CardBody className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {BEWERTUNGS_ACHSEN.map((achse) => (
                    <Notenzeile
                      key={achse.key}
                      label={achse.label}
                      wert={review[achse.key]}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Badge variante={FEUCHTIGKEIT_VARIANTE[feuchtigkeit.einordnung]}>
                    {FEUCHTIGKEIT_LABEL[feuchtigkeit.einordnung]}
                    {review.feuchtigkeitProzent !== null
                      ? ` ${formatiereProzent(review.feuchtigkeitProzent)}`
                      : ""}
                  </Badge>
                  <p className="max-w-[68ch] text-small text-text-muted">
                    {feuchtigkeit.hinweis}
                  </p>
                </div>

                {review.notiz ? (
                  <p className="max-w-[68ch] text-body text-text">{review.notiz}</p>
                ) : null}

                {reelUrl ? (
                  <p className="text-small">
                    <a
                      href={reelUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-sm text-accent underline hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      Instagram-Reel zu dieser Bewertung (öffnet in neuem Tab)
                    </a>
                  </p>
                ) : null}
              </CardBody>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
