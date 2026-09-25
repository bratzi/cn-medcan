import type { CSSProperties } from "react";

/** Schriftgrad des Worts; die Überschrift reserviert darunter etwas Platz danach. */
export const UEBERLAUF_GRAD = "clamp(3.5rem, 1rem + 12vw, 16rem)";

/** Etwas Platz unter dem Satz für den Versatz nach unten. */
export const ueberlaufPlatz: CSSProperties = {
  "--ueberlauf-grad": UEBERLAUF_GRAD,
  paddingBottom: "calc(var(--ueberlauf-grad) * 0.3)",
} as CSSProperties;

/**
 * Übergroßes Schlusswort einer Überschrift (Nutzer 2026-09-26) im Stil der
 * Hero-Wortmarke: Verlauf, vier driftende Konturen, ruhiger Puls. Kein
 * Absatz: ein Anker ohne Breite sitzt direkt hinter dem letzten Wort, von dort
 * setzt das Wort in derselben Zeile fort, leicht schräg nach rechts unten
 * versetzt, hinter dem Text und rechts aus dem Inhaltsbereich ragend. Die
 * Überschrift braucht `relative isolate` und `ueberlaufPlatz`.
 */
export function UeberlaufWort({ wort, absatz = false }: { wort: string; absatz?: boolean }) {
  // absatz (Nutzer 2026-09-26, "Terpenprofil."): eigene Zeile knapp unter dem Satz,
  // nur leicht nach rechts versetzt und schräg, statt am Satzende anzuschließen.
  return (
    <span className={absatz ? "relative block" : "relative inline-block w-0 align-baseline"}>
      <em
        className={
          absatz
            ? "pointer-events-none relative mx-auto -mt-[0.1em] block w-max translate-x-[0.35em] -rotate-3 text-left not-italic whitespace-nowrap"
            : "pointer-events-none absolute bottom-0 left-0 -z-10 block w-max origin-bottom-left translate-x-[0.08em] translate-y-[0.22em] -rotate-3 text-left not-italic whitespace-nowrap"
        }
        style={{ fontSize: "var(--ueberlauf-grad)" }}
      >
        {["marke-kontur-1", "marke-kontur-2", "marke-kontur-3", "marke-kontur-4"].map((klasse) => (
          <span key={klasse} aria-hidden="true" className={`marke-kontur ${klasse} justify-start font-hand text-kulisse leading-[0.85]`} style={{ fontSize: "1em" }}>
            <span>{wort}</span>
          </span>
        ))}
        {/* Glanz wie die Hero-Wortmarke (glanz-wort) im inneren Span, weil fazit-puls
            außen schon die Animation belegt. */}
        <span className="fazit-puls block font-hand text-kulisse leading-[0.85]" style={{ fontSize: "1em" }}>
          <span className="glanz-wort">{wort}</span>
        </span>
      </em>
    </span>
  );
}
