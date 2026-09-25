import { Bild } from "@/components/medien/Bild";
import { Badge } from "@/components/ui";
import type { KultivarTyp } from "@/db/enums";
import { formatiereProzentSpanne } from "@/lib/format";
import { kultivarTypLabel } from "@/lib/labels";
import { blueteBild } from "@/lib/medien";

const PROZENT_TERPEN = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 2 });

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
};

/**
 * Titelblatt der Aroma-Erkundung (Nutzer 2026-09-25): ganz oben und groß, damit
 * man sofort sieht, was bewertet wird. Links das Symbolbild in voller Größe,
 * rechts Name, Kultivar, Typ, Wirkstoffe, Hersteller und das Terpenprofil laut
 * Hersteller mit Anteilsbalken, zum Vergleich mit der Karte darunter.
 */
export function SortenKopf(props: SortenKopfProps) {
  const bildId = blueteBild(props.bildPfad);
  const hoechster = Math.max(0, ...props.terpene.map((terpen) => terpen.konzentrationProzent ?? 0));
  const fakten = [
    { label: "Hersteller", wert: props.herstellerName },
    { label: "Genetik", wert: props.genetik },
  ].filter((fakt): fakt is { label: string; wert: string } => Boolean(fakt.wert));

  return (
    <section
      aria-label={`Bewertet wird: ${props.handelsname}`}
      className="grid grid-cols-1 items-center gap-12 border-b-2 border-border-strong pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24"
    >
      {bildId ? (
        <figure className="flex w-full max-w-lg flex-col items-start gap-2 justify-self-center">
          <Bild id={bildId} dekorativ sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-square w-full object-contain" />
          <figcaption className="text-caption text-text-muted">Symbolbild</figcaption>
        </figure>
      ) : null}

      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-small uppercase tracking-gesperrt text-text-muted">Das bewerten wir</p>
          {/* Logoschrift im Farbverlauf wie die Schlagworte (Nutzer 2026-09-25). */}
          <h3
            className="farbverlauf font-hand text-balance wrap-break-word leading-[0.9]"
            style={{ fontSize: "calc(var(--text-kapitel) * 1.35)" }}
          >
            {props.handelsname}
          </h3>
          {props.kultivarName ? (
            <p className="font-buch text-h3 font-medium italic text-text">{props.kultivarName}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge variante="neutral">{kultivarTypLabel[props.kultivarTyp]}</Badge>
          </div>
          <p className="numeric text-h3 font-normal text-text">
            <span className="whitespace-nowrap">{`THC ${formatiereProzentSpanne(props.thcMin, props.thcMax)}`}</span>
            <span aria-hidden="true">{" · "}</span>
            <span className="sr-only">, </span>
            <span className="whitespace-nowrap">{`CBD ${formatiereProzentSpanne(props.cbdMin, props.cbdMax)}`}</span>
          </p>
          {fakten.length > 0 ? (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-small">
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
          <div className="flex flex-col gap-4">
            <p className="text-small uppercase tracking-gesperrt text-text-muted">Terpene laut Hersteller</p>
            <ul className="flex flex-col gap-4">
              {props.terpene.map((terpen) => {
                const anteil =
                  terpen.konzentrationProzent !== null && hoechster > 0
                    ? terpen.konzentrationProzent / hoechster
                    : Math.max(0.2, 1 - (terpen.rang - 1) * 0.2);
                return (
                  <li key={terpen.name} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className="text-body font-medium text-text">
                        {terpen.name}
                        {terpen.aromaProfil ? (
                          <span className="ml-2 text-small font-normal text-text-muted">{terpen.aromaProfil}</span>
                        ) : null}
                      </span>
                      <span className="numeric text-small text-text">
                        {terpen.konzentrationProzent !== null
                          ? PROZENT_TERPEN.format(terpen.konzentrationProzent / 100)
                          : `Rang ${terpen.rang}`}
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
        ) : null}
      </div>
    </section>
  );
}
