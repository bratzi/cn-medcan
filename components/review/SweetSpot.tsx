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

/**
 * Terpen-Intensität (Spec Redesign 15): je Terpen eine Skala von zu schwach
 * bis zu stark, der Sweet Spot liegt in der Mitte. Zu viel Terpen macht den
 * Geschmack aufdringlich, zu wenig lässt ihn flach wirken; gesucht ist die
 * Mitte. Die Markierung sitzt bei (wert - 1) / 4 der Breite.
 */
export function SweetSpot({ zeilen, titel = "Terpen-Intensität" }: { zeilen: readonly SweetSpotZeile[]; titel?: string }) {
  if (zeilen.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-buch text-h2 font-medium text-text">
        {titel}: <em className="farbverlauf italic">Sweet Spot</em> gesucht
      </h3>
      <ul className="flex flex-col gap-6">
        {zeilen.map((zeile) => {
          const anteil = ((Math.min(Math.max(zeile.wert, 1), 5) - 1) / 4) * 100;
          return (
            <li key={zeile.terpen} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-buch text-h3 font-medium text-text">{zeile.terpen}</span>
                <span className="numeric text-small text-text-muted">
                  {`${einordnung(zeile.wert)} · ${WERT.format(zeile.wert)} von 5`}
                  {zeile.anzahl ? ` · ${zeile.anzahl} Bewertungen` : ""}
                </span>
              </div>
              <div aria-hidden="true" className="sweet-spot-spur relative h-3 rounded-full">
                <span
                  className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm"
                  style={{ left: `${anteil}%` }}
                />
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
