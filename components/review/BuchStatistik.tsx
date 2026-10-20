import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { BuchStatistik as Daten, StatistikEintrag } from "@/lib/buch-statistik";

type Texte = Woerterbuch["reviews"]["statistik"];
type Karte = { schluessel: keyof Daten; einheit: keyof Texte["einheit"]; nachkomma: number };

const KARTEN: readonly Karte[] = [
  { schluessel: "meistBewertet", einheit: "bewertungen", nachkomma: 0 },
  { schluessel: "best", einheit: "mittel", nachkomma: 1 },
  { schluessel: "niedrigst", einheit: "mittel", nachkomma: 1 },
  { schluessel: "bluetenKommentare", einheit: "kommentare", nachkomma: 0 },
  { schluessel: "bewertungenKommentare", einheit: "kommentare", nachkomma: 0 },
  { schluessel: "bewertungenLikes", einheit: "likes", nachkomma: 0 },
];

/**
 * Zahlen aus dem Buch: sechs kleine Ranglisten über alle Sorten und Bewertungen. Server-Komponente,
 * statisch mit der Seite. Zahlen stehen von Hand im Logo-Ton, die Einheit gedruckt daneben.
 * Nur Zählungen und Noten, keine Heilaussagen (HWG).
 */
export function BuchStatistik({ daten, texte, sprache }: { daten: Daten; texte: Texte; sprache: Sprache }) {
  return (
    <section
      aria-labelledby="buch-statistik-titel"
      className="mt-16 scroll-mt-[calc(var(--kopf-h,4rem)+2rem)] sm:mt-24"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2 id="buch-statistik-titel" className="font-buch text-kapitel text-balance text-text">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        </h2>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {KARTEN.map((k) => (
          <StatistikKarte
            key={k.schluessel}
            titel={texte.titel[k.schluessel]}
            leer={texte.leer}
            eintraege={daten[k.schluessel]}
            einheit={texte.einheit[k.einheit]}
            nachkomma={k.nachkomma}
            sprache={sprache}
          />
        ))}
      </div>
    </section>
  );
}

function StatistikKarte({
  titel,
  leer,
  eintraege,
  einheit,
  nachkomma,
  sprache,
}: {
  titel: string;
  leer: string;
  eintraege: readonly StatistikEintrag[];
  einheit: string;
  nachkomma: number;
  sprache: Sprache;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <h3 className="font-buch text-h3 text-text">{titel}</h3>
      {eintraege.length === 0 ? (
        <p className="text-body text-pretty text-text-muted">{leer}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {eintraege.map((e, i) => (
            <li key={e.href} className="flex min-w-0 items-baseline gap-3">
              <span aria-hidden="true" className="w-4 shrink-0 text-caption text-text-muted numeric">
                {i + 1}
              </span>
              <Link prefetch={false} href={e.href} className={`${namenLinkKlassen()} min-w-0 flex-1 wrap-break-word`}>
                {e.titel}
              </Link>
              <span className="shrink-0 whitespace-nowrap">
                <span className="font-hand text-notiz text-logo numeric">{formatiereZahl(e.wert, nachkomma, sprache)}</span>{" "}
                <span className="ms-2 text-caption text-text-muted">{einheit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
