import { INTENSITAETS_STUFEN } from "@/lib/query/bewertung";

export type SweetSpotZeile = {
  terpen: string;
  /** Wert der Bewertung oder Mittel der Community, 1 bis 5. */
  wert: number;
  /** Nur beim Mittel: wie viele Bewertungen dahinterstehen. */
  anzahl?: number;
};

const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function einordnung(wert: number): string {
  const naechste = INTENSITAETS_STUFEN.reduce((a, b) => (Math.abs(b.wert - wert) < Math.abs(a.wert - wert) ? b : a));
  return naechste.label;
}

function anteil(wert: number): number {
  return ((Math.min(Math.max(wert, 1), 5) - 1) / 4) * 100;
}

type Bedienung = {
  /** Eigener Wert je Terpen; ist er gesetzt, wird die Spur zum Regler. */
  eigen: Readonly<Record<string, number>>;
  aendern: (terpen: string, wert: number) => void;
  aktivieren?: (terpen: string | null) => void;
};

/**
 * Terpen-Intensität (Spec Redesign 15): je Terpen eine Skala von zu schwach
 * bis zu stark, der Sweet Spot liegt in der Mitte. Zu viel Terpen macht den
 * Geschmack aufdringlich, zu wenig lässt ihn flach wirken; gesucht ist die
 * Mitte. Die Markierung sitzt bei (wert - 1) / 4 der Breite.
 *
 * Mit `bedienung` wird jede Spur zum Regler: der Punkt zeigt den eigenen
 * Wert, ein blasser Ring den Wert der Bewertung oder Community.
 */
export function SweetSpot({
  zeilen,
  titel,
  bedienung,
}: {
  zeilen: readonly SweetSpotZeile[];
  titel?: string;
  bedienung?: Bedienung;
}) {
  if (zeilen.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-buch text-h2 font-medium text-text text-balance">
        {titel ? `${titel}: ` : null}
        <em className="farbverlauf italic">Sweet Spot</em> gesucht
      </h3>
      <ul className="flex flex-col gap-6" onPointerLeave={() => bedienung?.aktivieren?.(null)}>
        {zeilen.map((zeile) => {
          const eigen = bedienung?.eigen[zeile.terpen];
          const gezeigt = eigen ?? zeile.wert;
          return (
            <li
              key={zeile.terpen}
              className="flex flex-col gap-2"
              onPointerEnter={() => bedienung?.aktivieren?.(zeile.terpen)}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-buch text-h3 font-medium text-text">{zeile.terpen}</span>
                <span className="numeric text-small text-text-muted">
                  {`${einordnung(gezeigt)} · ${WERT.format(gezeigt)} von 5`}
                  {bedienung && zeile.anzahl ? ` · Community ${WERT.format(zeile.wert)}` : ""}
                  {!bedienung && zeile.anzahl ? ` · ${zeile.anzahl} Bewertungen` : ""}
                </span>
              </div>
              <div className="sweet-spot-spur relative h-3 rounded-full outline-offset-8 outline-focus-ring has-[input:focus-visible]:outline-2">
                {bedienung && zeile.anzahl ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-kopierstift/40"
                    style={{ left: `${anteil(zeile.wert)}%` }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm"
                  style={{ left: `${anteil(gezeigt)}%` }}
                />
                {bedienung ? (
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={gezeigt}
                    aria-label={`${zeile.terpen}: Intensität`}
                    aria-valuetext={`${einordnung(gezeigt)}, ${WERT.format(gezeigt)} von 5`}
                    onFocus={() => bedienung.aktivieren?.(zeile.terpen)}
                    onBlur={() => bedienung.aktivieren?.(null)}
                    onChange={(e) => bedienung.aendern(zeile.terpen, Number(e.target.value))}
                    className="absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 cursor-pointer opacity-0"
                  />
                ) : null}
              </div>
              <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
                <span>zu schwach</span>
                <span>Sweet Spot</span>
                <span>zu stark</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
