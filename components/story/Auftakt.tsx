import { LoopSchalter } from "@/components/medien/LoopSchalter";
import Link from "next/link";
import { preload } from "react-dom";

import { Loop } from "@/components/medien/Loop";
import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";

/**
 * Sektion 1 (Spec Redesign 7 und 8): der Umschlag als Filmbühne. Das Video
 * füllt die erste Ansicht in Schwarzweiß, ein Verlauf dunkelt es zur Schrift
 * hin ab, die Sektion trägt dunkle Rollen (`buehne-dunkel`). Die h1 ist die
 * handschriftliche Wortmarke von Rand zu Rand. Wortmarke und Unterzeile
 * schreiben sich per CSS (globals.css, `schreiben`) und stehen deshalb ohne
 * JavaScript und bei reduzierter Bewegung sofort da; dann bleibt auch das
 * Standbild stehen (loops.ts startet das Video nur mit der StoryBuehne).
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Wähl mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  // Standbild ist das größte Bild der ersten Ansicht: vor allem anderen anfordern.
  preload("/medien/auftakt-loop-standbild.webp", { as: "image", fetchPriority: "high" });

  return (
    <section
      aria-labelledby="auftakt-titel"
      data-story="auftakt"
      className="buehne-dunkel relative isolate -mt-(--kopf-h,4rem) flex min-h-svh flex-col overflow-hidden pt-[calc(var(--kopf-h,4rem)+4rem)] pb-16 sm:pb-24"
    >
      <div aria-hidden="true" data-story="auftakt-film" className="pointer-events-none absolute inset-0 -z-10">
        <Loop id="auftakt-loop" buehne className="h-full opacity-75" />
        <div className="absolute inset-0 bg-linear-to-b from-surface/40 via-surface/5 to-surface" />
      </div>

      {/* Wortmarke und Unterzeile als eine Gruppe auf gemeinsamer Achse: die
          Unterzeile in derselben aufrechten Druckschrift wie das Storytelling,
          leicht und deutlich kleiner, damit die Handschrift allein führt. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 sm:gap-6 sm:px-8">
        <h1 id="auftakt-titel" data-story="titel" className="auftakt-marke relative flex justify-center">
          <Wortmarke groesse="plakat" />
        </h1>
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="max-w-[28ch] text-center font-buch text-[clamp(1.75rem,1rem+2.4vw,3.25rem)] leading-tight font-light tracking-tight text-balance text-text/90"
        >
          Cannabis, offen gelegt.
        </p>
      </div>

      <div className="mx-auto w-full max-w-360 px-4 sm:px-8">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-6">
            <p data-story="intro" data-story-einstieg="" className="text-body text-text text-pretty sm:text-h3 sm:font-normal">
              Wir testen Sorten nach festem Schema. Gemeinsam entscheiden wir, welche als Nächstes drankommt.
            </p>
            <Link href="#abstimmung" className={buttonKlassen("primary", "md")}>
              Wähl mit
            </Link>
          </div>
          <div className="flex flex-col items-end gap-4">
            {/* Pause fuer die Videos (WCAG 2.2.2); erscheint erst, wenn loops.ts sie startet. */}
            <LoopSchalter />
            <Unterzeile className="auftakt-unterzeile" />
          </div>
        </div>
      </div>
    </section>
  );
}
