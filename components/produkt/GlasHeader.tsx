/**
 * AUSNAHME-KOMPONENTE - bitte nicht verallgemeinern.
 *
 * `.claude/skills/ui-design-engine.md` Abschnitt 4 verbietet Glassmorphism
 * ("Kein Glassmorphism (`backdrop-blur`, halbtransparente Karten) ohne
 * Funktion"). Dieser Header ist eine ausdrueckliche, vom Nutzer angeforderte
 * Ausnahme und gilt AUSSCHLIESSLICH fuer genau diesen Produktkopf. Die Regel
 * bleibt fuer alle anderen Komponenten, Karten, Panels und Header in Kraft.
 * Wer hier einen Praezedenzfall sucht, findet keinen.
 *
 * Lesbarkeit hat Vorrang vor dem Effekt (Abschnitt 6, Kontrast >= 4.5:1):
 * - Der Text sitzt auf einer eigenen Schicht `bg-surface/95`, nicht direkt
 *   auf dem Bild. Selbst im schlechtesten Fall (5 % eines reinweissen bzw.
 *   reinschwarzen Bildes schlagen durch) bleibt das Paar
 *   `text-text` / `surface` deutlich ueber 4.5:1 - in Light wie in Dark.
 * - In dieser Schicht wird bewusst KEIN `text-muted` verwendet: im Dark Mode
 *   erreicht `neutral-400` auf einer durchscheinenden Flaeche 4.5:1 nicht
 *   mehr zuverlaessig. Alle Texte hier laufen auf `text-text`.
 * - `prefers-reduced-transparency: reduce` schaltet auf eine vollstaendig
 *   deckende Flaeche ohne Blur zurueck.
 */

import { Badge } from "@/components/ui";
import { InstagramEmbed } from "@/components/produkt/InstagramEmbed";
import { cn } from "@/lib/cn";
import { darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";
import type { Darreichungsform, KultivarTyp } from "@/lib/generated/prisma/enums";

/**
 * Tailwind v4 kennt keine eingebaute Variante fuer
 * `prefers-reduced-transparency`. Statt eine Regel in `app/globals.css`
 * zu ergaenzen (dort ist Fremdarbeit tabu), wird die At-Rule als arbitrary
 * variant notiert - das unterstuetzt Tailwind v4 ohne Konfiguration.
 * Einschraenkung: die Media Feature wird derzeit nur von einem Teil der
 * Browser ausgewertet (Safari und Chromium-basierte Browser mit
 * entsprechender Systemeinstellung); Firefox ignoriert sie noch. Deshalb
 * ist die deckende Schicht (95 %) schon der Normalfall und die Variante
 * nur die zusaetzliche Absicherung.
 */
const REDUZIERTE_TRANSPARENZ =
  "[@media(prefers-reduced-transparency:reduce)]:bg-surface " +
  "[@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none";

const NOTE_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export type GlasHeaderProps = {
  handelsname: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  anzahlApothekenVerfuegbar: number;
  /** Mittel der Gesamtnoten aller freigegebenen Bewertungen, sonst `null`. */
  gesamtnote: number | null;
  anzahlBewertungen: number;
  /** Pfad des Produktbildes; existiert die Datei nicht, greift der Verlauf. */
  herstellerBildPfad: string | null;
  /** Reel-URL; ohne Angabe greift die Umgebungsvariable im Embed selbst. */
  reelUrl?: string | null;
  className?: string;
};

/**
 * Nur projektinterne, absolute Pfade zulassen. Damit kann kein fremder Host
 * und kein aus der URL ausbrechendes Zeichen in `background-image` landen.
 */
function sichererBildPfad(pfad: string | null): string | null {
  if (!pfad) return null;
  if (!pfad.startsWith("/")) return null;
  if (/["'()\\\s]/.test(pfad)) return null;
  return pfad;
}

export function GlasHeader({
  handelsname,
  kultivarName,
  kultivarTyp,
  darreichungsform,
  anzahlApothekenVerfuegbar,
  gesamtnote,
  anzahlBewertungen,
  herstellerBildPfad,
  reelUrl,
  className,
}: GlasHeaderProps) {
  const bildPfad = sichererBildPfad(herstellerBildPfad);
  const verfuegbar = anzahlApothekenVerfuegbar > 0;

  return (
    <section
      aria-labelledby="produkt-titel"
      className={cn(
        "relative isolate overflow-hidden rounded-lg border border-border",
        className,
      )}
    >
      {/*
        Grundschicht: ruhiger Verlauf aus den semantischen Flaechen-Tokens.
        Sie liegt IMMER darunter - fehlt die Bilddatei (sie ist derzeit nicht
        im Repo vorhanden), laedt das Bild einfach nicht und der Verlauf
        bleibt stehen. `onError` gibt es in einer Server Component nicht,
        deshalb ist der Fallback rein deklarativ.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-br from-surface-sunken via-surface-raised to-surface-sunken"
      />

      {bildPfad ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${bildPfad})` }}
        />
      ) : null}

      {/* Glas- und Textschicht: 95 % deckend, damit der Kontrast haelt. */}
      <div
        className={cn(
          "flex flex-col gap-8 bg-surface/95 p-8 backdrop-blur-xl md:flex-row md:items-start md:justify-between",
          REDUZIERTE_TRANSPARENZ,
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          {/* Handelsname steht unveraendert, mit Umbruch statt Ellipse. */}
          <h1
            id="produkt-titel"
            title={handelsname}
            className="text-h1 break-words text-text"
          >
            {handelsname}
          </h1>

          {kultivarName ? (
            <p className="text-body text-text">{kultivarName}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Badge variante="neutral">{kultivarTypLabel[kultivarTyp]}</Badge>
            <Badge variante="neutral">
              {darreichungsformLabel[darreichungsform]}
            </Badge>
            <Badge variante={verfuegbar ? "success" : "danger"}>
              {verfuegbar
                ? `Bei ${anzahlApothekenVerfuegbar} Apotheke${anzahlApothekenVerfuegbar === 1 ? "" : "n"} verfügbar`
                : "Derzeit nicht lieferbar"}
            </Badge>
          </div>

          {gesamtnote !== null ? (
            <p className="text-body text-text">
              <span className="font-medium">Gesamtnote </span>
              <span className="numeric">{NOTE_FORMATTER.format(gesamtnote)}</span>
              <span> von </span>
              <span className="numeric">{NOTE_FORMATTER.format(5)}</span>
              <span>
                {` — Mittel aus ${anzahlBewertungen} freigegebenen ${anzahlBewertungen === 1 ? "Bewertung" : "Bewertungen"}`}
              </span>
            </p>
          ) : (
            <p className="text-body text-text">
              Noch keine freigegebenen Bewertungen.
            </p>
          )}
        </div>

        <div className="w-full max-w-64 shrink-0">
          <InstagramEmbed url={reelUrl} bezeichnung={handelsname} />
        </div>
      </div>
    </section>
  );
}
