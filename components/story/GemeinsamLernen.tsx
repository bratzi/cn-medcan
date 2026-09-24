import { Loop } from "@/components/medien/Loop";
import { Button } from "@/components/ui";

/**
 * Sektion 4 (Spec 5.1, Spec TP3 8.4): die Schleife. Die Überschrift trägt
 * die Aussage; Kreis, Stationen und Video sind deren Bild und deshalb
 * aria-hidden. Die ersten beiden Stationen schreibt die Community von Hand,
 * die letzten beiden druckt das Buch. Handschrift im Grad text-vermerk
 * (32 px, die Mindestgröße): so groß wie die gedruckten Stationen, und am
 * rechten Rand verdeckt sie das Video nicht.
 */
const STATIONEN = [
  { text: "Ihr schlagt vor.", hand: true, ort: "top-0 left-1/2 -translate-x-1/2" },
  { text: "Ihr stimmt ab.", hand: true, ort: "top-1/2 right-0 -translate-y-1/2" },
  { text: "Ich teste.", hand: false, ort: "bottom-0 left-1/2 -translate-x-1/2" },
  { text: "Alle lesen.", hand: false, ort: "top-1/2 left-0 -translate-y-1/2" },
] as const;

function stationKlasse(hand: boolean): string {
  return hand ? "font-hand text-vermerk text-kopierstift" : "font-buch text-h1 font-medium text-text";
}

export function GemeinsamLernen() {
  return (
    <section aria-labelledby="lernen-titel" data-story="lernen" className="px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 id="lernen-titel" className="font-buch text-kapitel text-text text-balance">
            Ihr schlagt vor. Ihr stimmt ab. Ich teste. Alle lesen.
          </h2>
          <p className="max-w-[56ch] text-body text-text-muted text-pretty">
            In jeder Runde setze ich ein oder zwei Sorten selbst. Zwei weitere Plätze wählt ihr. Was
            gewinnt, teste ich nach festem Schema, und der Eintrag steht danach hier für alle.
          </p>
        </div>

        <div className="hidden flex-col items-center gap-6 md:flex">
          <div aria-hidden="true" data-story="schleife" className="relative mx-auto aspect-square w-full max-w-xl">
            {/* Kein vector-effect="non-scaling-stroke" am Kreis: damit rechnete Chrome
                die Strichlaenge in Bildschirmpixeln, pathLength aber in SVG-Einheiten,
                und der Kreis blieb offen. */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-text">
              <circle
                data-story="schleife-linie"
                cx="200"
                cy="200"
                r="160"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                pathLength={1}
                strokeDasharray="1"
              />
            </svg>
            <div className="absolute inset-1/4 overflow-hidden">
              <Loop id="pflanze-loop" className="h-full" />
            </div>
            {STATIONEN.map((station) => (
              <span
                key={station.text}
                className={`absolute bg-surface px-2 whitespace-nowrap ${station.ort} ${stationKlasse(station.hand)}`}
              >
                {station.text}
              </span>
            ))}
          </div>
          {/* Pause fuer das Video (WCAG 2.2.2), ausserhalb des aria-hidden-Bildes.
              Sichtbar erst, wenn die StoryBuehne das Video startet (loops.ts):
              ohne JavaScript und bei reduzierter Bewegung laeuft nichts. */}
          <Button variante="secondary" hidden data-loop-schalter="">
            Video anhalten
          </Button>
        </div>

        <ol aria-hidden="true" className="flex flex-col gap-6 border-l border-text pl-6 md:hidden">
          {STATIONEN.map((station) => (
            <li key={station.text} className={stationKlasse(station.hand)}>
              {station.text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
