import Link from "next/link";

import { eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { namenLinkKlassen } from "@/components/ui/textlink";
import { formatiereDatum } from "@/lib/format";
import { berechneGesamtnote } from "@/lib/query/bewertung";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Alle Eintraege wie hinten in einem Buch (Spec TP2 4.1): Name, Punktlinie,
 * Note. Die ganze Zeile ist Klickflaeche (after:inset-0), der Name ist der
 * eine Link. Er springt auf den vollstaendigen Eintrag der Produktseite.
 */
export function Inhaltsverzeichnis({ eintraege }: { eintraege: readonly EintragDaten[] }) {
  return (
    <ol className="flex flex-col">
      {eintraege.map((eintrag) => (
        <li key={eintrag.id} className="relative py-4">
          <div className="flex items-baseline gap-4">
            <Link
              href={eintragHref(eintrag.slug, eintrag.id)}
              className={namenLinkKlassen(
                "min-w-0 font-buch text-h2 font-medium wrap-break-word after:absolute after:inset-0",
              )}
            >
              {eintrag.handelsname}
            </Link>
            <span aria-hidden="true" className="min-w-8 grow border-b border-dotted border-border-strong" />
            <span className="numeric shrink-0 text-h2 font-normal text-text">
              {NOTE.format(berechneGesamtnote(eintrag))}
              <span className="sr-only"> von 5</span>
            </span>
          </div>
          <p className="mt-2 text-small text-text-muted">
            <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm)}</time>
            {eintrag.chargenNr ? (
              <>
                {" · Charge "}
                <span className="numeric">{eintrag.chargenNr}</span>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
