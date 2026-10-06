import type { EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { Badge, type BadgeVariante } from "@/components/ui";
import { formatiereDatum, formatiereProzent, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { bewerteFeuchtigkeit, type FeuchtigkeitsEinordnung } from "@/lib/query/bewertung";

const FEUCHTIGKEIT: Record<FeuchtigkeitsEinordnung, BadgeVariante> = {
  optimal: "success",
  zu_trocken: "warning",
  zu_feucht: "danger",
  unbekannt: "neutral",
};

/** Hinweistext je Einordnung im Wörterbuch (schema.feuchte). */
const FEUCHTE_HINWEIS = {
  optimal: "optimal",
  zu_trocken: "zuTrocken",
  zu_feucht: "zuFeucht",
  unbekannt: "unbekannt",
} as const satisfies Record<FeuchtigkeitsEinordnung, string>;

/**
 * Das Kolophon unten auf der linken Buchseite (Spec 2026-10-05): Datum, Charge und die Zahl der
 * Bewertungen des Autors, darunter die Restfeuchte der Charge. Die Zahl fehlt ohne Autor oder
 * ohne Abfrageergebnis, nie steht dort eine 0 als Ersatz.
 */
export function BuchKolophon({ eintrag, w, sprache }: { eintrag: EintragDaten; w: Woerterbuch; sprache: Sprache }) {
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? w.review.feuchte[feuchtigkeit.einordnung]
      : `${w.review.feuchte[feuchtigkeit.einordnung]} · ${formatiereProzent(eintrag.feuchtigkeitProzent, 1, sprache)}`;
  // Ohne Messwert sagt das Badge schon alles.
  const hinweis = feuchtigkeit.einordnung === "unbekannt" ? null : w.schema.feuchte[FEUCHTE_HINWEIS[feuchtigkeit.einordnung]];
  return (
    <div data-eintritt="auf" style={ablauf(4)} className="mt-auto flex min-w-0 flex-col gap-4 border-t border-border pt-6">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.buch.datum}</dt>
          <dd className="text-small text-text">
            <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.buch.chargeLabel}</dt>
          <dd className="text-small text-text wrap-break-word">
            {eintrag.chargenNr ? <span className="numeric">{eintrag.chargenNr}</span> : w.buch.nichtAngegeben}
          </dd>
        </div>
        {typeof eintrag.autorBewertungen === "number" ? (
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-small text-text-muted">{w.buch.bewertungenInsgesamt}</dt>
            <dd className="numeric text-small text-text">{formatiereZahl(eintrag.autorBewertungen, 0, sprache)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung]}>{feuchtigkeitsText}</Badge>
        {hinweis ? (
          <p title={hinweis} className="max-w-[56ch] text-small text-text-muted text-pretty lg:line-clamp-2">
            {hinweis}
          </p>
        ) : null}
      </div>
    </div>
  );
}
