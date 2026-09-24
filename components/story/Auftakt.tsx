import Link from "next/link";
import { preload } from "react-dom";

import { Bild } from "@/components/medien/Bild";
import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";
import { bildQuelle } from "@/lib/medien";

/** Tatsächliche Breite des Leitobjekts: bestimmt, welche Datei geladen wird. */
const LEIT_SIZES = "(min-width: 768px) 24vw, 48vw";

/**
 * Sektion 1 (Spec Redesign 2): der Umschlag in Ebenen. Hinten die h1 als
 * riesiger grüner Serif-Titel, davor das Motiv, darunter die handschriftliche
 * Wortmarke als Signatur mit der gedruckten Unterzeile. Beide schreiben sich per
 * CSS (globals.css, `schreiben`) und stehen deshalb ohne JavaScript und bei
 * reduzierter Bewegung sofort da.
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Wähl mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  const leitobjekt = bildQuelle("leitobjekt");
  // Größtes Bild der ersten Ansicht: vor allen anderen Ressourcen anfordern (Spec 6.4).
  preload(leitobjekt.src, {
    as: "image",
    imageSrcSet: leitobjekt.srcSet,
    imageSizes: LEIT_SIZES,
    fetchPriority: "high",
  });

  return (
    <section
      aria-labelledby="auftakt-titel"
      data-story="auftakt"
      className="relative overflow-hidden px-4 pt-8 pb-16 sm:px-8 sm:pt-12 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-360">
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="font-buch text-h2 font-medium italic text-text-muted sm:text-h1"
        >
          Cannabis, offen gelegt.
        </p>

        <div className="relative mt-8">
          <h1
            id="auftakt-titel"
            data-story="titel"
            className="relative z-0 font-buch text-riesig text-accent text-balance"
          >
            Grünes <em className="italic">Buch</em>
          </h1>
          {/* Signatur: dieselbe Marke noch einmal von Hand, für Vorleser bereits in der h1. */}
          <div aria-hidden="true" className="auftakt-marke relative z-20 mt-4 w-fit">
            <Wortmarke groesse="signatur" />
          </div>
          <Unterzeile className="auftakt-unterzeile relative z-0 mt-8" />

          {/* Ohne z-index und ohne transform: beides schafft einen eigenen
              Stapelkontext, und multiply mischte dann nur mit dem leeren
              Wrapper statt mit Titel und Papier. Zentriert per my-auto. */}
          <div className="pointer-events-none absolute top-[4vw] right-[2vw] z-10 h-fit w-[48vw] md:right-[10vw] md:w-[24vw]">
            {/* Weicher Rand: der Grund des Fotos hat einen leichten Verlauf, ohne
                Maske bliebe dessen Kante als Rechteck ueber dem Titel stehen. */}
            <Bild
              id="leitobjekt"
              sizes={LEIT_SIZES}
              prioritaet
              className="mask-radial-closest-side mask-radial-from-70% mask-radial-to-100%"
            />
          </div>
        </div>

        <div className="mt-8 flex max-w-2xl flex-col items-start gap-6">
          <p data-story="intro" data-story-einstieg="" className="text-body text-text text-pretty sm:text-h3 sm:font-normal">
            Ich teste Sorten nach festem Schema. Du entscheidest mit, welche als Nächstes drankommt.
          </p>
          <Link href="#abstimmung" className={buttonKlassen("primary", "md")}>
            Wähl mit
          </Link>
        </div>
      </div>
    </section>
  );
}
