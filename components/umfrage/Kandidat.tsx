import Link from "next/link";

import { Badge } from "@/components/ui";
import { namenLinkKlassen } from "@/components/ui/textlink";
import type { UmfrageOptionAnsicht } from "@/lib/query/umfragen";

const ZAHL_FORMATTER = new Intl.NumberFormat("de-DE");

/** Handschrift am Stimmzettel: die Mindestgröße 32 px (Spec TP3 4 und 8.6). */
const VERMERK = "font-hand text-vermerk text-kopierstift";

export type KandidatProps = {
  option: UmfrageOptionAnsicht;
  gesamt: number;
  gewaehlt: boolean;
  zeigeStimmen: boolean;
};

export function stimmenAnteil(option: UmfrageOptionAnsicht, gesamt: number): number {
  if (option.stimmen === null || gesamt <= 0) return 0;
  return Math.min(Math.max(option.stimmen / gesamt, 0), 1) * 100;
}

function stimmenText(stimmen: number): string {
  return `${ZAHL_FORMATTER.format(stimmen)} ${stimmen === 1 ? "Stimme" : "Stimmen"}`;
}

/**
 * Ein Kandidat auf dem Stimmzettel. Der Handelsname ist gedruckt
 * (Newsreader, Leitplanke 4). Die Herkunft ist sichtbar unterschieden:
 * gesetzte Plätze tragen den Stempel "Gesetzt", Community-Plätze den
 * Vermerk "von euch" von Hand (Spec TP3 8.6). Die eigene Stimme bekommt
 * zum Badge ein handgeschriebenes "x" vor dem Namen, nur als Bild.
 * Gesetzte Plätze tragen keinen Zähler und keinen Balken: `stimmen` ist
 * dort `null` ("steht nicht zur Wahl"), nicht `0` ("niemand wollte sie").
 * Eigene Datei, damit er ohne die Server Action des Stimmformulars rendert.
 */
export function Kandidat({ option, gesamt, gewaehlt, zeigeStimmen }: KandidatProps) {
  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-2">
          {gewaehlt ? (
            <span aria-hidden="true" data-story="vermerk" className={VERMERK}>
              x
            </span>
          ) : null}
          <Link
            href={`/produkte/${option.slug}`}
            className={namenLinkKlassen("min-w-0 font-buch text-h3 font-medium wrap-break-word")}
            title={option.handelsname}
          >
            {option.handelsname}
          </Link>
        </span>

        <span className="flex items-center gap-2">
          {option.herkunft === "COMMUNITY" ? (
            <span data-story="vermerk" className={VERMERK}>
              von euch
            </span>
          ) : null}
          {option.istGewinner ? <Badge variante="success">Gewinner</Badge> : null}
          {gewaehlt ? <Badge variante="accent">Deine Stimme</Badge> : null}
          {zeigeStimmen && option.stimmen !== null ? (
            <span className="numeric text-small text-text">
              {/* Die Zahl zählt auf der Startseite hoch (bewegung/abstimmung.ts): sichtbar
                  aria-hidden, vorgelesen wird der Endwert. */}
              <span className="sr-only">{stimmenText(option.stimmen)}</span>
              <span aria-hidden="true">
                <span data-stimmzahl="" data-ziel={option.stimmen}>
                  {ZAHL_FORMATTER.format(option.stimmen)}
                </span>
                {option.stimmen === 1 ? " Stimme" : " Stimmen"}
              </span>
            </span>
          ) : null}
        </span>
      </div>

      {zeigeStimmen && option.stimmen !== null ? (
        <span aria-hidden="true" className="mt-2 flex h-2 w-full overflow-hidden bg-surface-sunken">
          {/* Datengrafik in Tinte, nicht in Blattgruen: Gruen ist Bedienung. */}
          {/* Wächst auf der Startseite von links (data-stimmbalken, bewegung/abstimmung.ts). */}
          <span
            data-stimmbalken=""
            className="block h-full origin-left bg-text"
            style={{ width: `${stimmenAnteil(option, gesamt)}%` }}
          />
        </span>
      ) : null}
    </li>
  );
}
