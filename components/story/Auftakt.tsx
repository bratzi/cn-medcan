import Link from "next/link";
import { preload } from "react-dom";

import { Bild } from "@/components/medien/Bild";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";
import { bildQuelle } from "@/lib/medien";

/** Tatsächliche Breite des Motivs: bestimmt, welche Datei geladen wird. */
const MOTIV_SIZES = "(min-width: 768px) 30vw, 56vw";

/**
 * Sektion 1 (Spec Redesign 7): der Umschlag als Plakat. Die h1 ist die
 * handschriftliche Wortmarke, von Rand zu Rand, darunter Satz, Button und
 * die gedruckte Unterzeile. Wortmarke und Unterzeile schreiben
 * sich per CSS (globals.css, `schreiben`) und stehen deshalb ohne JavaScript
 * und bei reduzierter Bewegung sofort da. Der Freisteller steht vor den
 * Buchstaben, zwischen den beiden Wörtern.
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Wähl mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  const motiv = bildQuelle("frei-bluete");
  // Größtes Bild der ersten Ansicht: vor allen anderen Ressourcen anfordern.
  preload(motiv.src, { as: "image", imageSrcSet: motiv.srcSet, imageSizes: MOTIV_SIZES, fetchPriority: "high" });

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
      <div className="pointer-events-none absolute top-[14vw] left-[36vw] z-10 w-[56vw] md:top-[8vw] md:left-[38vw] md:w-[30vw]">
        <Bild id="frei-bluete" sizes={MOTIV_SIZES} prioritaet />
      </div>

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
