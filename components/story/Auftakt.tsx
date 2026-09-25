import { LoopSchalter } from "@/components/medien/LoopSchalter";
import Link from "next/link";
import { preload } from "react-dom";

import { Loop } from "@/components/medien/Loop";
import { Kopfzeile } from "@/components/story/Kopfzeile";
import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";

/**
 * Konturen hinter der Wortmarke (Nutzer 2026-09-25, statt der 3D-Bahnen): die
 * Schrift noch einmal übereinander, nur als Umriss, in Grün- und Violetttönen,
 * leicht versetzt. Jede driftet ruhig in eigenem Takt (globals.css,
 * .marke-kontur-N); mit der Maus darüber folgen sie verschieden tief.
 */
const KONTUREN = [
  { klasse: "marke-kontur-1", tiefe: "1.4" },
  { klasse: "marke-kontur-2", tiefe: "2.2" },
  { klasse: "marke-kontur-3", tiefe: "3" },
  { klasse: "marke-kontur-4", tiefe: "1" },
] as const;

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
      className="buehne-dunkel relative isolate -mt-(--kopf-h,4rem) flex min-h-svh flex-col overflow-hidden pt-[calc(var(--kopf-h,4rem)+4rem)] pb-8"
    >
      <div aria-hidden="true" data-story="auftakt-film" className="pointer-events-none absolute inset-0 -z-10">
        <Loop id="auftakt-loop" buehne className="h-full opacity-75" />
        <div className="absolute inset-0 bg-linear-to-b from-surface/40 via-surface/5 to-surface" />
      </div>

      {/* Wortmarke und Unterzeile als eine Gruppe auf gemeinsamer Achse: die
          Unterzeile in derselben aufrechten Druckschrift wie das Storytelling,
          leicht und deutlich kleiner, damit die Handschrift allein führt. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 sm:gap-6 sm:px-8">
        {/* Konturen der Wortmarke dahinter: reine Dekoration, deshalb neben der h1;
            die h1 bleibt genau die Wortmarke. */}
        <div data-story="titel" data-punkt="" className="relative flex justify-center">
          {KONTUREN.map((kontur) => (
            <span
              key={kontur.klasse}
              aria-hidden="true"
              data-punkt-tiefe={kontur.tiefe}
              className={`marke-kontur ${kontur.klasse}`}
            >
              <Wortmarke groesse="plakat" />
            </span>
          ))}
          <h1 id="auftakt-titel" className="auftakt-marke relative flex justify-center">
            {/* Pulsiert wie das Community-Fazit (Nutzer 2026-09-25). */}
            <span className="fazit-puls">
              <Wortmarke groesse="plakat" />
            </span>
          </h1>
        </div>
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="max-w-[28ch] text-center font-sans text-[clamp(1.75rem,1rem+2.4vw,3.25rem)] leading-tight font-light uppercase tracking-gesperrt text-balance text-text/90"
        >
          Cannabis, offen gelegt.
        </p>
      </div>

      <div className="mx-auto w-full max-w-360 px-4 sm:px-8">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-6">
            <p data-story="intro" data-story-einstieg="" className="max-w-[48ch] font-sans text-small uppercase leading-relaxed tracking-gesperrt text-text text-pretty">
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
      {/* Kopfzeile am Fuß der ersten Ansicht: ohne Scrollen sichtbar, über die volle Breite. */}
      <div className="mt-8">
        <Kopfzeile />
      </div>
    </section>
  );
}
