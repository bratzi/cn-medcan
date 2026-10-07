import Link from "next/link";

import { AromaKarte } from "@/components/review/AromaKarte";
import { aromaSerien } from "@/components/review/aroma-serien";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { FALZ_LINKS, FALZ_RECHTS } from "@/components/review/falz";
import { KartenBild } from "@/components/review/SortenKopf";
import { Avatar, buttonKlassen, namenLinkKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { profilHref } from "@/lib/kurz-id";
import { formatiereDatum, formatiereWert, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { aromaTexte, type Woerterbuch } from "@/lib/i18n/typen";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

/**
 * "Wirkung" nur im vollstaendigen Eintrag (Spec TP1 Abschnitt 2): gross
 * gesetzt laese sie sich oeffentlich als Wirksamkeitsversprechen.
 */
const AUSZUG_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

/**
 * Eine Seite der Doppelseite. Deckend (eigene Fläche) und `relative`, weil das
 * Buch (Buch.tsx) die zwei Hälften einzeln um den Falz dreht; der Falz ab lg
 * ist je Seite ein leiser Verlauf von 2rem an der Mitte. Die Seiten haben ab
 * sm 3rem Innenabstand, der Falz reicht also nie unter Bild oder Text.
 */
const SEITE = "relative flex min-w-0 flex-col gap-8 bg-surface-raised p-6 sm:p-12";

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Eine Bewertung als Auszug in einer aufgeschlagenen Doppelseite (Spec TP2 4.3, T7, Nutzer
 * 2026-09-29): links Kopf, Name, Datum, Blätter-Note und darunter der gekürzte Bewertungstext;
 * rechts vier Werte, Karte und Charge mit dem Weg zum ganzen Eintrag. Das Buch auf der
 * Blütenseite setzt seine Doppelseiten in BuchDoppelseite.tsx. Id und Ueberschrift sind je
 * Eintrag eindeutig, damit "Ganzen Eintrag lesen" auf die Doppelseite im Buch springt.
 */
export function Doppelseite({ eintrag, ueberschrift: Ueberschrift, story = false, w, sprache }: DoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
  );
  const name = eintrag.autorName ?? (eintrag.istBetreiber ? w.buch.betreiberName : w.buch.ohneName);
  const charge = eintrag.chargenNr ? t(w.bluete.charge, { charge: eintrag.chargenNr }) : null;

  const noten = (
    <dl className="grid grid-cols-2 gap-6">
      {AUSZUG_ACHSEN.map((achse) => (
        // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
        <div key={achse.key} className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
          <dd className="numeric text-h1 text-text">
            <span aria-hidden="true" {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}>
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
  );

  // Die Charge schließt die Seite ab wie eine Fußnote, darunter der Weg zum ganzen Eintrag.
  const fuss = (
    <div className="mt-auto flex min-w-0 flex-col gap-4">
      {charge ? <p className={cn("text-small text-text-muted", eintrag.chargenNr && "numeric")}>{charge}</p> : null}
      <p>
        <Link prefetch={false} href={eintragHref(eintrag.slug, eintrag.id)} className={buttonKlassen("secondary", "md")}>
          {w.review.ganzerEintrag}
        </Link>
      </p>
    </div>
  );

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div data-buchseite="links" className={cn(SEITE, FALZ_LINKS)}>
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
          {eintrag.handelsname}
        </Ueberschrift>

        {/* Blütenbild zwischen Titel und Noten über die volle Breite der Karte,
            dasselbe wie in der Blütenübersicht (Nutzer 2026-09-26). */}
        {eintrag.bildPfad ? (
          <div className="contents">
            <KartenBild bildPfad={eintrag.bildPfad} symbolbild={w.aroma.sortenKopf.symbolbild} />
          </div>
        ) : null}

        <div className="contents">
          {/* Wer spricht: Avatar (T8) vor dem Namen. Ohne Autor und ohne Betreiber
              (ohneName) gibt es keinen Kreis, sonst stünde ein Initial für "Anonym". */}
          <div className="flex min-w-0 items-center gap-4">
            {eintrag.autorName || eintrag.istBetreiber ? (
              <Avatar name={name} bildId={eintrag.autorAvatarId} groesse="md" />
            ) : null}
            {/* gap-1 = 4px: Name und Datum sind ein Paar. Die Zeilen sind
                Blöcke, damit sie der Textausrichtung der Seite folgen. */}
            <p className="flex min-w-0 flex-col gap-1">
              <span className="text-body font-medium text-text wrap-break-word">
                {/* Link nur bei öffentlichem Profil (Spec Profil 9); sonst bleibt der Name reiner Text. */}
                {eintrag.autorName && eintrag.autorProfil ? (
                  <Link prefetch={false} href={profilHref(eintrag.autorProfil)} className={namenLinkKlassen()}>
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </span>
              <span className="text-small text-text-muted">{datum}</span>
            </p>
          </div>

          {eintrag.gesamtnote !== null ? (
            <div className="contents">
              <BlattAnzeige
                note={eintrag.gesamtnote}
                text={t(w.bewerten.blattWert, { wert: formatiereWert(eintrag.gesamtnote, sprache) })}
              />
            </div>
          ) : null}
        </div>

        {eintrag.notiz ? <p className="line-clamp-6 max-w-[56ch] text-body text-pretty text-text">{eintrag.notiz}</p> : null}
      </div>

      <div data-buchseite="rechts" className={cn(SEITE, FALZ_RECHTS)}>
        {noten}
        <AromaKarte terpene={eintrag.terpene} serien={aromaSerien(eintrag, w)} texte={texte} />
        {fuss}
      </div>
    </article>
  );
}
