import Link from "next/link";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { BeschaffenheitsLeiste } from "@/components/review/BeschaffenheitsLeiste";
import { KartenBild } from "@/components/review/SortenKopf";
import { SweetSpot } from "@/components/review/SweetSpot";
import { herstellerProfil } from "@/lib/aromakarte";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { Badge, buttonKlassen, type BadgeVariante } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";
import { aromaTexte } from "@/lib/i18n/typen";
import {
  BEWERTUNGS_ACHSEN,
  bewerteFeuchtigkeit,
  type FeuchtigkeitsEinordnung,
} from "@/lib/query/bewertung";

/**
 * "Wirkung" nur im vollstaendigen Eintrag (Spec TP1 Abschnitt 2): gross
 * gesetzt laese sie sich oeffentlich als Wirksamkeitsversprechen.
 */
const AUSZUG_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

const FEUCHTIGKEIT: Record<FeuchtigkeitsEinordnung, BadgeVariante> = {
  optimal: "success",
  zu_trocken: "warning",
  zu_feucht: "danger",
  unbekannt: "neutral",
};

/** Hinweistext je Einordnung im Woerterbuch (schema.feuchte). */
const FEUCHTE_HINWEIS = {
  optimal: "optimal",
  zu_trocken: "zuTrocken",
  zu_feucht: "zuFeucht",
  unbekannt: "unbekannt",
} as const satisfies Record<FeuchtigkeitsEinordnung, string>;

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  /** "auszug": Startseite und /reviews; "voll": Produktseite. */
  umfang: "auszug" | "voll";
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Eine Bewertung als aufgeschlagene Doppelseite (Spec TP2 4.3). Links
 * Kopf und Noten, rechts Geschmack, Notiz und im vollen Eintrag das Reel.
 * Id und Ueberschrift sind je Eintrag eindeutig, damit mehrere Doppelseiten
 * auf einer Seite stehen koennen und "Ganzen Eintrag lesen" darauf springt.
 */
/** Zwei Serien: was die Herstellerangaben erwarten lassen und was diese Bewertung gefunden hat. */
function aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[] {
  const hersteller = herstellerProfil(eintrag.terpene);
  const serien: AromaSerie[] = [];
  if (hersteller) serien.push({ name: w.aroma.serien.hersteller, ton: "gruen", matrix: hersteller });
  serien.push({ name: w.review.dieseBewertung, ton: "lila", matrix: eintrag.geschmacksMatrix });
  return serien;
}

export function Doppelseite({ eintrag, umfang, ueberschrift: Ueberschrift, story = false, w, sprache }: DoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const voll = umfang === "voll";
  const achsen = voll ? BEWERTUNGS_ACHSEN : AUSZUG_ACHSEN;
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
  );
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? w.review.feuchte[feuchtigkeit.einordnung]
      : `${w.review.feuchte[feuchtigkeit.einordnung]} · ${formatiereProzent(eintrag.feuchtigkeitProzent, 1, sprache)}`;
  // Kein Ersatz aus der Umgebung: nur eine gueltige eigene URL ergibt ein Reel.
  const reel = voll && baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;

  return (
    // Buchfalz ab lg: ein leiser Schatten je 2rem links und rechts der Mitte, genau
    // am Spalt der zwei gleich breiten Seiten. Die Seiten haben mindestens 3rem
    // Innenabstand, der Falz reicht also nie unter Bild oder Text.
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2 lg:bg-[linear-gradient(90deg,transparent_calc(50%_-_2rem),color-mix(in_oklab,var(--color-text)_7%,transparent)_50%,transparent_calc(50%_+_2rem))]"
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12 lg:border-r lg:border-border">
        <p className="text-small text-text-muted">
          {voll ? (
            eintrag.chargenNr ? (
              <>
                <span className="numeric">{t(w.bluete.charge, { charge: eintrag.chargenNr })}</span>
              </>
            ) : (
              w.review.chargeFehlt
            )
          ) : (
            <>
              {datum}
              {eintrag.chargenNr ? (
                <>
                  {" · "}
                  <span className="numeric">{t(w.bluete.charge, { charge: eintrag.chargenNr })}</span>
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
            story ? "text-kapitel" : "text-h2 font-medium",
          )}
        >
          {voll ? (
            <>
              {w.review.bewertungVom.split("{datum}")[0]}
              {datum}
              {w.review.bewertungVom.split("{datum}")[1]}
            </>
          ) : (
            eintrag.handelsname
          )}
        </Ueberschrift>

        {/* Blütenbild zwischen Titel und Noten über die volle Breite der Karte,
            dasselbe wie in der Blütenübersicht (Nutzer 2026-09-26). */}
        {eintrag.bildPfad ? <KartenBild bildPfad={eintrag.bildPfad} symbolbild={w.aroma.sortenKopf.symbolbild} /> : null}

        <dl className="grid grid-cols-2 gap-6">
          {achsen.map((achse) => (
            // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
            <div key={achse.key} className="flex flex-col gap-1">
              <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
              <dd className="numeric text-h1 text-text">
                <span
                  aria-hidden="true"
                  {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}
                >
                  {formatiereZahl(eintrag[achse.key], 1, sprache)}
                </span>
                <span aria-hidden="true" className="text-h3 text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${formatiereZahl(eintrag[achse.key], 1, sprache)} ${w.bluete.vonFuenf}`}</span>
              </dd>
            </div>
          ))}
        </dl>

        {voll ? (
          <div className="flex flex-col items-start gap-2">
            <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung]}>{feuchtigkeitsText}</Badge>
            <p className="max-w-[56ch] text-small text-text-muted">{w.schema.feuchte[FEUCHTE_HINWEIS[feuchtigkeit.einordnung]]}</p>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12">
        <AromaKarte terpene={eintrag.terpene} serien={aromaSerien(eintrag, w)} texte={texte} />
        {voll ? (
          <SweetSpot
            titel={w.aroma.erkundung.intensitaet}
            texte={texte}
            zeilen={Object.entries(eintrag.terpenIntensitaet).map(([terpen, wert]) => ({ terpen, wert }))}
          />
        ) : null}
        {voll ? (
          <BeschaffenheitsLeiste werte={eintrag.beschaffenheit} feuchte={null} texte={texte} />
        ) : null}
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
              {w.review.ganzerEintrag}
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
