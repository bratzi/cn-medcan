import Link from "next/link";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { BeschaffenheitsLeiste } from "@/components/review/BeschaffenheitsLeiste";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { BuchNotiz } from "@/components/review/BuchNotiz";
import { BuchReiter, type BuchReiterEintrag } from "@/components/review/BuchReiter";
import { NurAufgeschlagen } from "@/components/review/NurAufgeschlagen";
import { KartenBild } from "@/components/review/SortenKopf";
import { SweetSpot } from "@/components/review/SweetSpot";
import { herstellerProfil } from "@/lib/aromakarte";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { Avatar, Badge, buttonKlassen, type BadgeVariante } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent, formatiereWert, formatiereZahl } from "@/lib/format";
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

/**
 * Eine Seite der Doppelseite. Deckend (eigene Fläche) und `relative`, weil das
 * Buch (Buch.tsx) die zwei Hälften einzeln um den Falz dreht; der Falz ab lg
 * ist je Seite ein leiser Verlauf von 2rem an der Mitte. Die Seiten haben ab
 * sm 3rem Innenabstand, der Falz reicht also nie unter Bild oder Text.
 */
const SEITE = "relative flex min-w-0 flex-col gap-8 bg-surface-raised p-6 sm:p-12";
const FALZ_LINKS =
  "lg:border-r lg:border-border lg:bg-[linear-gradient(to_left,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";
const FALZ_RECHTS =
  "lg:bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  /** "auszug": Startseite und /reviews; "voll": Buch auf der Blütenseite. */
  umfang: "auszug" | "voll";
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
  w: Woerterbuch;
  sprache: Sprache;
};

/** Zwei Serien: was die Herstellerangaben erwarten lassen und was diese Bewertung gefunden hat. */
function aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[] {
  const hersteller = herstellerProfil(eintrag.terpene);
  const serien: AromaSerie[] = [];
  if (hersteller) serien.push({ name: w.aroma.serien.hersteller, ton: "gruen", matrix: hersteller });
  serien.push({ name: w.review.dieseBewertung, ton: "lila", matrix: eintrag.geschmacksMatrix });
  return serien;
}

/**
 * Eine Bewertung als aufgeschlagene Doppelseite (Spec TP2 4.3, seit T7,
 * Nutzer 2026-09-29, neu geordnet): links Kopf, Name, Datum, Blätter-Note und
 * darunter der Bewertungstext, der die freie Fläche füllt; rechts Werte,
 * Karte und Charge. Id und Ueberschrift sind je Eintrag eindeutig, damit
 * mehrere Doppelseiten auf einer Seite (im Buch gestapelt) stehen koennen und
 * "Ganzen Eintrag lesen" darauf springt.
 */
export function Doppelseite({ eintrag, umfang, ueberschrift: Ueberschrift, story = false, w, sprache }: DoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const voll = umfang === "voll";
  const achsen = voll ? BEWERTUNGS_ACHSEN : AUSZUG_ACHSEN;
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
  );
  const name = eintrag.autorName ?? (eintrag.istBetreiber ? w.buch.betreiberName : w.buch.ohneName);
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? w.review.feuchte[feuchtigkeit.einordnung]
      : `${w.review.feuchte[feuchtigkeit.einordnung]} · ${formatiereProzent(eintrag.feuchtigkeitProzent, 1, sprache)}`;
  // Kein Ersatz aus der Umgebung: nur eine gueltige eigene URL ergibt ein Reel.
  const reel = voll && baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;
  const charge = eintrag.chargenNr ? t(w.bluete.charge, { charge: eintrag.chargenNr }) : voll ? w.review.chargeFehlt : null;

  const noten = (
    <dl className={cn("grid grid-cols-2 gap-6", voll && "lg:grid-cols-5 lg:gap-4")}>
      {achsen.map((achse) => (
        // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
        <div key={achse.key} className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
          <dd className={cn("numeric text-h1 text-text", voll && "lg:text-h2")}>
            <span aria-hidden="true" {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}>
              {formatiereZahl(eintrag[achse.key], 1, sprache)}
            </span>
            <span aria-hidden="true" className={cn("text-h3 text-text-muted", voll && "lg:text-small")}>
              {" / 5"}
            </span>
            <span className="sr-only">{`${formatiereZahl(eintrag[achse.key], 1, sprache)} ${w.bluete.vonFuenf}`}</span>
          </dd>
        </div>
      ))}
    </dl>
  );

  // Die Charge schließt die Seite ab wie eine Fußnote; im Auszug darunter der Weg zum ganzen Eintrag.
  const fuss =
    charge || !voll ? (
      <div className="mt-auto flex flex-col gap-4">
        {charge ? <p className={cn("text-small text-text-muted", eintrag.chargenNr && "numeric")}>{charge}</p> : null}
        {voll ? null : (
          <p>
            <Link href={eintragHref(eintrag.slug, eintrag.id)} className={buttonKlassen("secondary", "md")}>
              {w.review.ganzerEintrag}
            </Link>
          </p>
        )}
      </div>
    ) : null;

  const karte = <AromaKarte terpene={eintrag.terpene} serien={aromaSerien(eintrag, w)} texte={texte} kompakt={voll} />;
  const intensitaet = Object.entries(eintrag.terpenIntensitaet).map(([terpen, wert]) => ({ terpen, wert }));
  const reiter: BuchReiterEintrag[] = [
    // buch-karte: auf niedrigen Bildschirmen verkleinert (globals.css), damit sie auf die Seite passt.
    { schluessel: "karte", titel: w.buch.reiterKarte, inhalt: <div className="buch-karte">{karte}</div> },
  ];
  if (intensitaet.length > 0) {
    reiter.push({
      schluessel: "sweetspot",
      titel: w.buch.reiterSweetSpot,
      inhalt: <SweetSpot titel={w.aroma.erkundung.intensitaet} texte={texte} spalten zeilen={intensitaet} />,
    });
  }
  if (Object.keys(eintrag.beschaffenheit).length > 0) {
    reiter.push({
      schluessel: "beschaffenheit",
      titel: w.buch.reiterBeschaffenheit,
      inhalt: <BeschaffenheitsLeiste werte={eintrag.beschaffenheit} feuchte={null} texte={texte} />,
    });
  }
  if (reel) {
    reiter.push({
      schluessel: "reel",
      titel: w.buch.reiterReel,
      inhalt: <InstagramEmbed url={reel} bezeichnung={eintrag.handelsname} texte={w.reel} />,
    });
  }

  /* Im Buch (voll) ab lg hat die Doppelseite eine feste Höhe (--buch-h, globals.css), damit sie samt
     Steuerung auf einen Bildschirm passt (T7b, Nutzer 2026-09-30). Links Kopf, Name mit Blättern, die
     Noten in einer Zeile, Restfeuchte, der Text (begrenzt, „Weiterlesen“) und die Charge; rechts die
     großen Werte als Reiter. Unter lg (mobil zurückgestellt) steht alles untereinander. */
  const seite = cn(SEITE, voll && "lg:gap-4 lg:overflow-clip lg:p-6");

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className={cn(
        "grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2",
        voll && "lg:h-(--buch-h)",
      )}
    >
      <div data-buchseite="links" className={cn(seite, FALZ_LINKS)}>
        {/* Kopf */}
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
            dasselbe wie in der Blütenübersicht (Nutzer 2026-09-26). Im Buch ab lg
            nicht: das Titelblatt darüber zeigt es schon, die Höhe gehört dem Inhalt (T7b). */}
        {eintrag.bildPfad ? (
          <div className={voll ? "lg:hidden" : "contents"}>
            <KartenBild bildPfad={eintrag.bildPfad} symbolbild={w.aroma.sortenKopf.symbolbild} />
          </div>
        ) : null}

        {/* Im Buch ab lg stehen Name und Blätter in einer Zeile, sonst untereinander. */}
        <div
          className={
            voll ? "flex flex-col gap-8 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4" : "contents"
          }
        >
          {/* Wer spricht: Avatar (T8) vor dem Namen. Ohne Autor und ohne Betreiber
              (ohneName) gibt es keinen Kreis, sonst stünde ein Initial für "Anonym". */}
          <div className="flex items-center gap-4">
            {eintrag.autorName || eintrag.istBetreiber ? (
              <Avatar name={name} bildId={eintrag.autorAvatarId} groesse="md" />
            ) : null}
            {/* gap-1 = 4px: Name und Datum bzw. Marke sind ein Paar. Die Zeilen sind
                Blöcke, damit sie der Textausrichtung der Seite folgen. */}
            <p className="flex flex-col gap-1">
              <span className="text-body font-medium text-text wrap-break-word">{name}</span>
              <span className="text-small text-text-muted">
                {voll ? (
                  <Badge variante={eintrag.istBetreiber ? "accent" : "neutral"} zeichen={false}>
                    {eintrag.istBetreiber ? w.buch.betreiber : w.buch.community}
                  </Badge>
                ) : (
                  datum
                )}
              </span>
            </p>
          </div>

          {eintrag.gesamtnote !== null ? (
            <BlattAnzeige
              note={eintrag.gesamtnote}
              text={t(w.bewerten.blattWert, { wert: formatiereWert(eintrag.gesamtnote, sprache) })}
            />
          ) : null}
        </div>

        {voll ? (
          <>
            {noten}
            <div className="flex flex-col items-start gap-2 max-md:items-center lg:flex-row lg:items-center lg:gap-4">
              <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung]}>{feuchtigkeitsText}</Badge>
              <p className="max-w-[56ch] text-small text-text-muted max-md:mx-auto lg:line-clamp-2">
                {w.schema.feuchte[FEUCHTE_HINWEIS[feuchtigkeit.einordnung]]}
              </p>
            </div>
          </>
        ) : null}

        {eintrag.notiz ? (
          voll ? (
            <BuchNotiz text={eintrag.notiz} weiterlesen={w.buch.weiterlesen} schliessen={w.buch.schliessen} />
          ) : (
            <p className="line-clamp-6 max-w-[56ch] text-body text-pretty text-text">{eintrag.notiz}</p>
          )
        ) : null}

        {voll ? fuss : null}
      </div>

      <div data-buchseite="rechts" className={cn(seite, FALZ_RECHTS)}>
        {/* Im Buch nur auf nahen Seiten (CPU-Limit, T7-Review), sonst immer. Die
            Fläche bleibt stehen: das Buch dreht sie beim Blättern. */}
        <NurAufgeschlagen>
          {voll ? (
            <BuchReiter bezeichnung={w.buch.reiter} reiter={reiter} />
          ) : (
            <>
              {noten}
              {karte}
              {fuss}
            </>
          )}
        </NurAufgeschlagen>
      </div>
    </article>
  );
}
