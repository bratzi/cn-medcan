import { LoopSchalter } from "@/components/medien/LoopSchalter";
import { Loop } from "@/components/medien/Loop";
import { Schlagwort } from "@/components/story/Schlagwort";

/**
 * Sektion 4 (Spec Redesign 4): die Schleife. Das Video läuft blass und
 * bildschirmfüllend hinter der Sektion und blendet oben und unten weich aus.
 * Seit 2026-09-25 (Nutzer: Typografie und Anordnung überarbeiten): links die
 * Einleitung, rechts die vier Stationen als Zeilen mit Trennlinie; die Ziffer
 * in der Logoschrift, der Satz einheitlich in der Buchschrift, das Verb als
 * Schlagwort wie im Storytelling. Die Überschrift trägt die Aussage (sr-only),
 * die Stationen sind deren sichtbares Bild und deshalb aria-hidden.
 */
const STATIONEN = [
  { wir: "Wir", verb: "schlagen vor." },
  { wir: "Wir", verb: "stimmen ab." },
  { wir: "Wir", verb: "testen." },
  { wir: "Wir", verb: "bewerten." },
] as const;

export function GemeinsamLernen() {
  return (
    <section
      aria-labelledby="lernen-titel"
      data-story="lernen"
      className="relative isolate overflow-x-clip px-4 py-32 sm:px-8 sm:py-48"
    >
      <div aria-hidden="true" className="video-einbettung pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <Loop id="pflanze-loop" buehne className="h-full opacity-50" />
      </div>
      {/* Unten zwischen dieser und der nächsten Sektion (Nutzer 2026-09-25). */}
      <Schlagwort satz="wir stimmen ab" oben="bottom-0 translate-y-1/2" />

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-24">
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-32 lg:self-start">
          <p className="text-small uppercase tracking-gesperrt text-text-muted">So läuft eine Runde</p>
          {/* Die Stationen rechts sagen es schon sichtbar; die Überschrift bleibt
              nur für Screenreader und als Sprungziel (Nutzer 2026-09-25). */}
          <h2 id="lernen-titel" className="sr-only">
            Wir schlagen vor. Wir stimmen ab. Wir testen. Wir bewerten.
          </h2>
          <p className="max-w-[44ch] font-buch text-h2 leading-snug text-text text-pretty">
            Jede Runde bringt neue Sorten auf die Liste. Was die meisten Stimmen holt, testen wir nach festem
            Schema, und der Eintrag steht danach hier für alle.
          </p>
          {/* Pause fuer das Video (WCAG 2.2.2). Sichtbar erst, wenn die StoryBuehne
              das Video startet (loops.ts): ohne JavaScript laeuft nichts. */}
          <LoopSchalter />
        </div>

        <ol aria-hidden="true" className="flex flex-col">
          {STATIONEN.map((station, index) => (
            <li
              key={station.verb}
              className="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-4 border-t border-border-strong py-8 last:border-b sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-8 md:py-10"
            >
              <span className="farbverlauf font-hand text-vermerk leading-none tabular-nums">0{index + 1}</span>
              <span className="font-buch text-erzaehlung leading-[1.1] text-text text-balance">
                {station.wir}{" "}
                <em className="farbverlauf font-hand text-erzaehlung not-italic leading-[0.9]" style={{ fontSize: "1.3em" }}>
                  {station.verb}
                </em>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
