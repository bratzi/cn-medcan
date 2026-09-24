import Link from "next/link";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";

/**
 * Sektion 1 (Spec Redesign 7): der Umschlag als Plakat. Die h1 ist die
 * handschriftliche Wortmarke, von Rand zu Rand, darunter Satz, Button und
 * die gedruckte Unterzeile. Wortmarke und Unterzeile schreiben
 * sich per CSS (globals.css, `schreiben`) und stehen deshalb ohne JavaScript
 * und bei reduzierter Bewegung sofort da. Das Motiv vor den Buchstaben kommt
 * mit den Freistellern (Welle 2).
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Wähl mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  return (
    <section aria-labelledby="auftakt-titel" data-story="auftakt" className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
      <div className="mx-auto w-full max-w-360 px-4 sm:px-8">
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="font-buch text-h2 font-medium italic text-text-muted sm:text-h1"
        >
          Cannabis, offen gelegt.
        </p>
      </div>

      <h1 id="auftakt-titel" data-story="titel" className="auftakt-marke relative z-0 mt-4 text-center">
        <Wortmarke groesse="plakat" />
      </h1>

      <div className="mx-auto w-full max-w-360 px-4 sm:px-8">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-6">
            <p data-story="intro" data-story-einstieg="" className="text-body text-text text-pretty sm:text-h3 sm:font-normal">
              Ich teste Sorten nach festem Schema. Du entscheidest mit, welche als Nächstes drankommt.
            </p>
            <Link href="#abstimmung" className={buttonKlassen("primary", "md")}>
              Wähl mit
            </Link>
          </div>
          <Unterzeile className="auftakt-unterzeile" />
        </div>
      </div>
    </section>
  );
}
