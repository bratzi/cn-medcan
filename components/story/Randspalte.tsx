import type { Randnotiz } from "@/lib/query/community";

const ZAHL = new Intl.NumberFormat("de-DE");

/**
 * Die Randspalte der Sektion 3 (Spec TP3 8.3): die Zahl gedruckt in Newsreader
 * Mono, das Wort von Hand. Mit Zahl wird die Notiz als ein Satz vorgelesen
 * (sr-only); die sichtbaren Teile sind aria-hidden, weil die StoryBuehne
 * die Zahl hochzählt. Ein Leitsatz steht allein und wird direkt gelesen.
 * `min-w-0` und `flex-wrap`: große Zahlen schieben das Wort in die nächste
 * Zeile, statt bei 320 px überzulaufen.
 */
export function Randspalte({ notizen }: { notizen: readonly Randnotiz[] }) {
  return (
    <ul data-story="randspalte" className="flex flex-col gap-8">
      {notizen.map((notiz) => {
        if (notiz.zahl === null) {
          return (
            <li key={notiz.wort}>
              <span data-story="randnotiz" className="inline-block font-hand text-notiz text-kopierstift">
                {notiz.wort}
              </span>
            </li>
          );
        }
        const zahl = ZAHL.format(notiz.zahl);
        return (
          <li key={notiz.wort} className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="sr-only">{`${zahl} ${notiz.wort}`}</span>
            <span aria-hidden="true" data-randzahl="" data-ziel={notiz.zahl} className="numeric text-display text-text">
              {zahl}
            </span>
            <span aria-hidden="true" data-story="randnotiz" className="font-hand text-notiz text-kopierstift">
              {notiz.wort}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
