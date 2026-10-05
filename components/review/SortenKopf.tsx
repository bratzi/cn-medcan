import { Bild } from "@/components/medien/Bild";
import { Badge } from "@/components/ui";
import type { KultivarTyp } from "@/db/enums";
import { formatiereAnteil, formatiereProzentSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { t } from "@/lib/i18n/text";
import { blueteBild } from "@/lib/medien";

export type SortenKopfProps = {
  handelsname: string;
  bildPfad: string | null;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  genetik: string | null;
  herstellerName: string | null;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  terpene: readonly { name: string; konzentrationProzent: number | null; rang: number; aromaProfil?: string | null }[];
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Titelblatt der Aroma-Erkundung (Nutzer 2026-09-25): ganz oben und groß, damit
 * man sofort sieht, was bewertet wird. Links das Symbolbild in voller Größe,
 * rechts Name, Kultivar, Typ, Wirkstoffe, Hersteller und das Terpenprofil laut
 * Hersteller mit Anteilsbalken, zum Vergleich mit der Karte darunter.
 */
export function SortenKopf(props: SortenKopfProps) {
  const bildId = blueteBild(props.bildPfad);
  const texte = props.w.aroma.sortenKopf;
  const fakten = [
    { label: texte.hersteller, wert: props.herstellerName },
    { label: texte.genetik, wert: props.genetik },
  ].filter((fakt): fakt is { label: string; wert: string } => Boolean(fakt.wert));

  return (
    <section
      aria-label={t(texte.bewertetWird, { name: props.handelsname })}
      className="grid grid-cols-1 items-center gap-12 border-b-2 border-border-strong pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24"
    >
      {bildId ? (
        <figure className="flex w-full max-w-lg flex-col items-start gap-2 justify-self-center max-lg:items-center">
          <Bild id={bildId} dekorativ sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-square w-full object-contain" />
          <figcaption className="text-caption text-text-muted">{texte.symbolbild}</figcaption>
        </figure>
      ) : null}

      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-4 max-lg:items-center max-lg:text-center">
          <p className="text-small uppercase tracking-wide text-text-muted">{texte.dasBewertenWir}</p>
          {/* Logoschrift im Farbverlauf wie die Schlagworte (Nutzer 2026-09-25). Bewusste
              Nutzerausnahme zu Leitplanke 4 (Handelsnamen gedruckt); am 2026-09-26 bestätigt
              beibehalten, nicht "korrigieren". */}
          <h3
            className="farbverlauf font-hand text-erzaehlung text-balance wrap-break-word leading-[0.9]"
            style={{ fontSize: "calc(var(--text-kapitel) * 1.35)" }}
          >
            {props.handelsname}
          </h3>
          {props.kultivarName ? (
            <p className="font-buch text-h3 font-medium italic text-text">{props.kultivarName}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge variante="neutral">{props.w.label.kultivarTyp[props.kultivarTyp]}</Badge>
          </div>
          <p className="numeric text-h3 font-normal text-text">
            <span className="whitespace-nowrap">{`THC ${formatiereProzentSpanne(props.thcMin, props.thcMax, 1, props.sprache)}`}</span>
            <span aria-hidden="true">{" · "}</span>
            <span className="sr-only">, </span>
            <span className="whitespace-nowrap">{`CBD ${formatiereProzentSpanne(props.cbdMin, props.cbdMax, 1, props.sprache)}`}</span>
          </p>
          {fakten.length > 0 ? (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-small max-lg:justify-center">
              {fakten.map((fakt) => (
                <div key={fakt.label} className="flex gap-2">
                  <dt className="text-text-muted">{fakt.label}</dt>
                  <dd className="text-text">{fakt.wert}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {props.terpene.length > 0 ? (
          <TerpenProfil terpene={props.terpene} w={props.w} sprache={props.sprache} />
        ) : null}
      </div>
    </section>
  );
}

/**
 * Terpenprofil laut Hersteller mit Anteilsbalken. Steht im Sortenkopf der Startseite und seit
 * 2026-10-05 (Nutzer) auch oben auf der Blütenseite, dort anstelle der alten Terpen-Chips:
 * dieselbe Information soll nicht in zwei Formen auf einer Seite stehen, und das Profil gehört
 * nach oben zu den übrigen Angaben, nicht in einen eigenen Abschnitt weiter unten.
 */
export function TerpenProfil({
  terpene,
  w,
  sprache,
  className,
}: Pick<SortenKopfProps, "terpene" | "w" | "sprache"> & { className?: string }) {
  const hoechster = Math.max(0, ...terpene.map((terpen) => terpen.konzentrationProzent ?? 0));
  const texte = w.aroma.sortenKopf;
  return (
    <div className={className ? `flex flex-col gap-4 ${className}` : "flex flex-col gap-4"}>
      <p className="text-small uppercase tracking-wide text-text-muted">{texte.terpeneLautHersteller}</p>
      <ul className="flex flex-col gap-4">
        {terpene.map((terpen) => {
          const anteil =
            terpen.konzentrationProzent !== null && hoechster > 0
              ? terpen.konzentrationProzent / hoechster
              : Math.max(0.2, 1 - (terpen.rang - 1) * 0.2);
          return (
            <li key={terpen.name} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="text-body font-medium text-text">
                  {terpenAnzeige(terpen.name, sprache)}
                  {/* Stammdaten-Stichworte sind deutsch; im Englischen entfallen sie. */}
                  {terpen.aromaProfil && sprache === "de" ? (
                    <span className="ml-2 text-small font-normal text-text-muted">{terpen.aromaProfil}</span>
                  ) : null}
                </span>
                <span className="numeric text-small text-text">
                  {terpen.konzentrationProzent !== null
                    ? formatiereAnteil(terpen.konzentrationProzent / 100, 2, sprache)
                    : t(texte.rang, { rang: terpen.rang })}
                </span>
              </div>
              <div aria-hidden="true" className="h-2 rounded-full bg-border">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(anteil * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Kleines Blütenbild für den Kopf der Aroma-Karte; ohne Bild nichts. */
export function KartenBild({ bildPfad, symbolbild }: { bildPfad: string | null; symbolbild: string }) {
  const bildId = blueteBild(bildPfad);
  if (!bildId) return null;
  return (
    <figure className="flex flex-col items-start gap-1 max-lg:items-center">
      <div className="relative w-full">
        <Bild id={bildId} dekorativ sizes="(min-width: 1024px) 40vw, 90vw" className="h-auto w-full object-contain" />
      </div>
      <figcaption className="text-caption text-text-muted">{symbolbild}</figcaption>
    </figure>
  );
}
