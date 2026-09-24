import Link from "next/link";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { Netzdiagramm } from "@/components/review/Netzdiagramm";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { Badge, buttonKlassen, type BadgeVariante } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent } from "@/lib/format";
import {
  BEWERTUNGS_ACHSEN,
  bewerteFeuchtigkeit,
  type FeuchtigkeitsEinordnung,
} from "@/lib/query/bewertung";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * "Wirkung" nur im vollstaendigen Eintrag (Spec TP1 Abschnitt 2): gross
 * gesetzt laese sie sich oeffentlich als Wirksamkeitsversprechen.
 */
const AUSZUG_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

const FEUCHTIGKEIT: Record<FeuchtigkeitsEinordnung, { variante: BadgeVariante; label: string }> = {
  optimal: { variante: "success", label: "Restfeuchte optimal" },
  zu_trocken: { variante: "warning", label: "Zu trocken" },
  zu_feucht: { variante: "danger", label: "Zu feucht" },
  unbekannt: { variante: "neutral", label: "Restfeuchte unbekannt" },
};

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  /** "auszug": Startseite und /reviews; "voll": Produktseite. */
  umfang: "auszug" | "voll";
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
};

/**
 * Eine Bewertung als aufgeschlagene Doppelseite (Spec TP2 4.3). Links
 * Kopf und Noten, rechts Geschmack, Notiz und im vollen Eintrag das Reel.
 * Id und Ueberschrift sind je Eintrag eindeutig, damit mehrere Doppelseiten
 * auf einer Seite stehen koennen und "Ganzen Eintrag lesen" darauf springt.
 */
export function Doppelseite({ eintrag, umfang, ueberschrift: Ueberschrift, story = false }: DoppelseiteProps) {
  const voll = umfang === "voll";
  const achsen = voll ? BEWERTUNGS_ACHSEN : AUSZUG_ACHSEN;
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm)}</time>
  );
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? FEUCHTIGKEIT[feuchtigkeit.einordnung].label
      : `${FEUCHTIGKEIT[feuchtigkeit.einordnung].label} · ${formatiereProzent(eintrag.feuchtigkeitProzent)}`;
  // Kein Ersatz aus der Umgebung: nur eine gueltige eigene URL ergibt ein Reel.
  const reel = voll && baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12 lg:border-r lg:border-border">
        <p className="text-small text-text-muted">
          {voll ? (
            eintrag.chargenNr ? (
              <>
                {"Charge "}
                <span className="numeric">{eintrag.chargenNr}</span>
              </>
            ) : (
              "Charge nicht angegeben"
            )
          ) : (
            <>
              {datum}
              {eintrag.chargenNr ? (
                <>
                  {" · Charge "}
                  <span className="numeric">{eintrag.chargenNr}</span>
                </>
              ) : null}
            </>
          )}
        </p>

        <Ueberschrift
          id={titelId}
          className={cn(
            "font-buch text-balance text-text wrap-break-word hyphens-auto",
            // Startseite: gross wie das Kapitel darueber. Unterseiten: kleiner als
            // der Abschnittstitel (h2, text-h1), damit die Ebenen absteigen (Spec 3.3).
            story ? "text-kapitel font-light" : "text-h2 font-medium",
          )}
        >
          {voll ? <>Bewertung vom {datum}</> : eintrag.handelsname}
        </Ueberschrift>

        <dl className="grid grid-cols-2 gap-6">
          {achsen.map((achse) => (
            // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
            <div key={achse.key} className="flex flex-col gap-1">
              <dt className="text-small text-text-muted">{achse.label}</dt>
              <dd className="numeric text-h1 text-text">
                <span
                  aria-hidden="true"
                  {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}
                >
                  {NOTE.format(eintrag[achse.key])}
                </span>
                <span aria-hidden="true" className="text-h3 text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${NOTE.format(eintrag[achse.key])} von 5`}</span>
              </dd>
            </div>
          ))}
        </dl>

        {voll ? (
          <div className="flex flex-col items-start gap-2">
            <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung].variante}>{feuchtigkeitsText}</Badge>
            <p className="max-w-[56ch] text-small text-text-muted">{feuchtigkeit.hinweis}</p>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12">
        <Netzdiagramm matrix={eintrag.geschmacksMatrix} />
        {eintrag.notiz ? (
          <p
            className={cn(
              "max-w-[56ch] text-body",
              voll ? "text-text" : "line-clamp-3 text-text-muted",
            )}
          >
            {eintrag.notiz}
          </p>
        ) : null}
        {reel ? <InstagramEmbed url={reel} bezeichnung={eintrag.handelsname} /> : null}
        {voll ? null : (
          <p className="mt-auto">
            <Link href={eintragHref(eintrag.slug, eintrag.id)} className={buttonKlassen("secondary", "md")}>
              Ganzen Eintrag lesen
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
