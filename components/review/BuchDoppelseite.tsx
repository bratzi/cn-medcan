import type { ReactNode } from "react";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { AromaKarte } from "@/components/review/AromaKarte";
import { aromaSerien, buchKarte } from "@/components/review/aroma-serien";
import { BeschaffenheitsLeiste } from "@/components/review/BeschaffenheitsLeiste";
import { BlattUrteil } from "@/components/review/BlattUrteil";
import { BuchKolophon } from "@/components/review/BuchKolophon";
import { BuchNotiz } from "@/components/review/BuchNotiz";
import { BuchReiter, ReiterLeiste, type BuchReiterEintrag } from "@/components/review/BuchReiter";
import { NotenLeiste } from "@/components/review/NotenLeiste";
import { NurAufgeschlagen } from "@/components/review/NurAufgeschlagen";
import { eintragAnker, type EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { FALZ_LINKS, FALZ_RECHTS } from "@/components/review/falz";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { aromaTexte, type Woerterbuch } from "@/lib/i18n/typen";
import type { KatalogTerpen } from "@/lib/query/strains";

/**
 * Eine Seite des Buchs. Deckend (eigene Fläche) und `relative`, weil das Buch (Buch.tsx) die zwei
 * Hälften einzeln um den Falz dreht. Ab lg 40 px rechts und links, damit der Falz (2rem) nie unter
 * Text oder Bild reicht.
 */
const SEITE = "relative flex min-w-0 flex-col gap-6 bg-surface-raised p-6 sm:p-10 lg:px-10 lg:py-8";

export type BuchDoppelseiteProps = {
  eintrag: EintragDaten;
  ueberschrift: "h2" | "h3";
  w: Woerterbuch;
  sprache: Sprache;
  /** Terpenkatalog, damit die Karte vom Bewertenden ergänzte Terpene zeigen kann. */
  katalog?: readonly KatalogTerpen[];
};

/**
 * Eine Bewertung als aufgeschlagene Doppelseite im Buch (Spec 2026-10-05, Nutzer): links die Person
 * mit Avatar, Name und dem Text der Bewertung, unten das Kolophon; rechts das Urteil mit Blättern
 * und den fünf Noten, darunter Terpenbewertung, Beschaffenheit und Reel als Register.
 *
 * Das Register steht auf dem Papier der Seite (Nutzer 2026-10-06): kein eigener Grund, kein Rand,
 * kein Anschnitt; die dunkle Einlage wirkte wie ein Fremdkörper im Buch. Ab lg trennt die Haarlinie
 * des Registers (BuchReiter.tsx) Urteil und Werte, mobil, wo die Reiter verborgen sind, eine
 * Haarlinie über den Werten. So bleibt das Buch hell wie dunkel aus einem Papier.
 *
 * Die Höhe wächst mit dem Inhalt (`lg:min-h-(--buch-h)`, globals.css): nichts läuft über den
 * Rahmen. Der Text links trägt nicht zur Höhe bei, die rechte Seite gibt sie vor. Id und
 * Überschrift sind je Eintrag eindeutig, damit mehrere Doppelseiten gestapelt stehen können und
 * der Sprung auf #eintrag-… die richtige trifft.
 */
export function BuchDoppelseite({ eintrag, ueberschrift: Ueberschrift, w, sprache, katalog = [] }: BuchDoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const name = eintrag.autorName ?? (eintrag.istBetreiber ? w.buch.betreiberName : w.buch.ohneName);
  // Ohne Autor und ohne Betreiber (ohneName) gibt es keinen Kreis, sonst stünde ein Initial für "Anonym".
  const hatPerson = Boolean(eintrag.autorName) || eintrag.istBetreiber;
  // Kein Ersatz aus der Umgebung: nur eine gültige eigene URL ergibt ein Reel.
  const reel = baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;

  const kartenWahl = buchKarte(eintrag.terpene, katalog, eintrag.terpenIntensitaet);
  const karte = (kopf: ReactNode) => (
    <AromaKarte
      terpene={kartenWahl.terpene}
      serien={aromaSerien(eintrag, w)}
      staerken={kartenWahl.staerken}
      ebenen={kartenWahl.ebenen}
      texte={texte}
      kompakt
      kopf={kopf}
    />
  );
  const reiter: BuchReiterEintrag[] = [
    { schluessel: "karte", titel: w.buch.reiterKarte, inhalt: karte(<ReiterLeiste titel={w.buch.reiterKarte} />), eigeneLeiste: true },
  ];
  if (Object.keys(eintrag.beschaffenheit).length > 0) {
    reiter.push({
      schluessel: "beschaffenheit",
      titel: w.buch.reiterBeschaffenheit,
      // Ab lg nennt der Reiter die Tafel; die Überschrift bleibt für Screenreader und mobil sichtbar.
      inhalt: <BeschaffenheitsLeiste werte={eintrag.beschaffenheit} feuchte={null} texte={texte} titelKlasse="lg:sr-only" />,
    });
  }
  if (reel) {
    reiter.push({
      schluessel: "reel",
      titel: w.buch.reiterReel,
      // Ab lg so hoch wie die Tafel, die Breite folgt dem Hochformat; der iframe lädt erst nach dem Klick.
      inhalt: (
        <div className="lg:min-h-0 lg:flex-1">
          <InstagramEmbed
            url={reel}
            bezeichnung={eintrag.handelsname}
            texte={w.reel}
            className="lg:h-full lg:w-auto lg:max-w-full lg:min-w-72"
          />
        </div>
      ),
    });
  }

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:min-h-(--buch-h) lg:grid-cols-2"
    >
      <div data-buchseite="links" className={cn(SEITE, FALZ_LINKS)}>
        <header data-eintritt="auf" style={ablauf(0)} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {hatPerson ? (
            // ring-offset-4 = 4px: optische Korrektur, der feine Ring liegt wie ein Stempel um das Bild.
            <Avatar
              name={name}
              bildId={eintrag.autorAvatarId}
              groesse="lg"
              className="ring-1 ring-border-strong ring-offset-4 ring-offset-surface-raised max-sm:size-20"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Ueberschrift
              id={titelId}
              title={name}
              aria-label={t(w.buch.bewertungVon, { name })}
              className="font-buch text-h1 font-medium text-balance text-text wrap-break-word lg:line-clamp-2"
            >
              {name}
            </Ueberschrift>
            <p>
              <Badge variante={eintrag.istBetreiber ? "accent" : "neutral"} zeichen={false}>
                {eintrag.istBetreiber ? w.buch.betreiber : w.buch.community}
              </Badge>
            </p>
          </div>
          {eintrag.istBetreiber ? null : (
            <p data-eintritt="schreiben" style={ablauf(1)} className="font-hand text-vermerk text-kopierstift max-sm:basis-full sm:ml-auto">
              {w.buch.vonEuch}
            </p>
          )}
        </header>

        {eintrag.notiz ? (
          <BuchNotiz text={eintrag.notiz} weiterlesen={w.buch.weiterlesen} schliessen={w.buch.schliessen} />
        ) : (
          <p className="text-body text-text-muted italic lg:flex-1">{w.buch.keinText}</p>
        )}

        <BuchKolophon eintrag={eintrag} w={w} sprache={sprache} />
      </div>

      <div data-buchseite="rechts" className={cn(SEITE, FALZ_RECHTS)}>
        {eintrag.gesamtnote !== null ? <BlattUrteil note={eintrag.gesamtnote} w={w} sprache={sprache} /> : null}
        <NotenLeiste eintrag={eintrag} w={w} sprache={sprache} />
        {/* Im Buch nur auf nahen Seiten (CPU-Limit, T7-Review), sonst immer. Die Fläche bleibt
            stehen: das Buch dreht sie beim Blättern. */}
        <NurAufgeschlagen>
          <div
            data-eintritt="einlage"
            style={ablauf(1)}
            className="flex min-h-0 flex-1 flex-col pt-2 max-lg:border-t max-lg:border-border max-lg:pt-6"
          >
            <BuchReiter bezeichnung={w.buch.reiter} reiter={reiter} />
          </div>
        </NurAufgeschlagen>
      </div>
    </article>
  );
}
