import type { CSSProperties } from "react";

/** Schriftgrad des Worts; die Überschrift reserviert darunter Platz danach. */
export const UEBERLAUF_GRAD = "clamp(3.5rem, 1rem + 12vw, 16rem)";

/** Platz unter dem Satz, damit das schräg versetzte Wort nichts Folgendes überdeckt. */
export const ueberlaufPlatz: CSSProperties = {
  "--ueberlauf-grad": UEBERLAUF_GRAD,
  paddingBottom: "calc(var(--ueberlauf-grad) * 0.7)",
} as CSSProperties;

/**
 * Übergroßes Schlusswort einer Überschrift (Nutzer 2026-09-25) im Stil der
 * Hero-Wortmarke: Verlauf, vier driftende Konturen, ruhiger Puls. Es steht
 * nicht eine Zeile tiefer, sondern hinter dem Satz, leicht schräg nach rechts
 * unten versetzt, und ragt rechts aus dem Inhaltsbereich. Die Überschrift
 * braucht `relative isolate` und `ueberlaufPlatz`; der Text bleibt in der
 * Lesereihenfolge am Satzende.
 */
export function UeberlaufWort({ wort }: { wort: string }) {
  return (
    <em
      className="pointer-events-none absolute bottom-0 left-[30%] -z-10 block w-max -rotate-3 text-left not-italic whitespace-nowrap"
      style={{ fontSize: "var(--ueberlauf-grad)" }}
    >
      {["marke-kontur-1", "marke-kontur-2", "marke-kontur-3", "marke-kontur-4"].map((klasse) => (
        <span key={klasse} aria-hidden="true" className={`marke-kontur ${klasse} justify-start font-hand text-kulisse leading-[0.85]`} style={{ fontSize: "1em" }}>
          <span>{wort}</span>
        </span>
      ))}
      <span className="fazit-puls farbverlauf font-hand text-kulisse leading-[0.85]" style={{ fontSize: "1em" }}>
        {wort}
      </span>
    </em>
  );
}
