/**
 * Pause und Play für Schalter im Stil `.loop-schalter` (globals.css): beide
 * stehen im Knopf, `data-angehalten` am Knopf blendet eines aus. Geteilt von
 * den Video-Schleifen (LoopSchalter) und dem Buch zum Blättern (T7).
 */
export function SchalterSymbole() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="loop-schalter-pause">
        <rect x="7" y="5.5" width="3.2" height="13" rx="1" />
        <rect x="13.8" y="5.5" width="3.2" height="13" rx="1" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="loop-schalter-play">
        <path d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.3 0-1.7l-9.6-6.3c-.7-.4-1.6.1-1.6.9z" />
      </svg>
    </>
  );
}
