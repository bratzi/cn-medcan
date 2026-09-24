import { Loop } from "@/components/medien/Loop";
import { Button } from "@/components/ui";
import { Schlagwort } from "@/components/story/Schlagwort";

/**
 * Sektion 4 (Spec Redesign 4): die Schleife. Das Video läuft blass und
 * bildschirmfüllend hinter der Sektion, davor stehen die vier Stationen
 * groß untereinander: die ersten beiden schreibt die Community von Hand,
 * die letzten beiden druckt das Buch. Die Überschrift trägt die Aussage,
 * die Stationen sind deren Bild und deshalb aria-hidden.
 */
const STATIONEN = [
  { text: "Ihr schlagt vor.", hand: true },
  { text: "Ihr stimmt ab.", hand: true },
  { text: "Ich teste.", hand: false },
  { text: "Alle lesen.", hand: false },
] as const;

export function GemeinsamLernen() {
  return (
    <section
      aria-labelledby="lernen-titel"
      data-story="lernen"
      className="relative isolate overflow-x-clip px-4 py-32 sm:px-8 sm:py-48"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <Loop id="pflanze-loop" className="h-full opacity-30" />
      </div>
      <Schlagwort satz="ihr stimmt ab" />

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-end gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ol aria-hidden="true" className="flex flex-col gap-2">
          {STATIONEN.map((station, index) => (
            <li
              key={station.text}
              className={
                station.hand
                  ? "font-hand text-notiz text-kopierstift"
                  : "font-buch text-manifest text-text"
              }
            >
              <span className="numeric mr-4 align-top text-small text-text-muted">0{index + 1}</span>
              {station.text}
            </li>
          ))}
        </ol>

        <div className="flex flex-col items-start gap-6">
          <h2 id="lernen-titel" className="font-buch text-h1 font-medium text-text text-balance">
            Ihr schlagt vor. Ihr stimmt ab. Ich teste. Alle lesen.
          </h2>
          <p className="max-w-[56ch] text-body text-text text-pretty">
            In jeder Runde setze ich ein oder zwei Sorten selbst. Zwei weitere Plätze wählt ihr. Was
            gewinnt, teste ich nach festem Schema, und der Eintrag steht danach hier für alle.
          </p>
          {/* Pause fuer das Video (WCAG 2.2.2). Sichtbar erst, wenn die StoryBuehne
              das Video startet (loops.ts): ohne JavaScript laeuft nichts. */}
          <Button variante="secondary" hidden data-loop-schalter="">
            Video anhalten
          </Button>
        </div>
      </div>
    </section>
  );
}
