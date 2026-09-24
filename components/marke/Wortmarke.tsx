import { cn } from "@/lib/cn";

type Props = {
  groesse: "kopf" | "umschlag";
  /** Nur umschlag: "Grünes Buch" in einer Zeile (Fuß) statt in zwei (Auftakt). */
  einzeilig?: boolean;
  className?: string;
};

/**
 * Die Marke "Grünes Buch" (Spec TP3 6): handschriftlich in Inspiration,
 * immer in Kopierstift-Violett. Der Name ist echter Text, kein Bild; wo er
 * nur Bild ist (Fuß), setzt der Aufrufer aria-hidden.
 *
 * kopf:     eine Zeile in text-marke (40 px), im Kopf aller Seiten.
 * umschlag: text-umschlag, zweizeilig im Auftakt (dort als h1), einzeilig
 *           im Fuß. Das Leerzeichen zwischen den Zeilen hält den
 *           zugänglichen Namen "Grünes Buch" zusammen. An
 *           `data-marke-zeile` hängt der geschriebene Einstieg (globals.css).
 */
export function Wortmarke({ groesse, einzeilig = false, className }: Props) {
  if (groesse === "kopf") {
    return <span className={cn("font-hand text-marke text-kopierstift", className)}>Grünes Buch</span>;
  }

  const zeile = einzeilig ? "inline-block" : "block";
  return (
    <span className={cn("block font-hand text-umschlag text-kopierstift", einzeilig && "whitespace-nowrap", className)}>
      <span data-marke-zeile="" className={zeile}>
        Grünes
      </span>{" "}
      <span data-marke-zeile="" className={zeile}>
        Buch
      </span>
    </span>
  );
}

/**
 * Die Unterzeile der Wortmarke (Spec TP3 6): gedruckt in Geist 500,
 * gespeichert in natürlicher Schreibung, Versalien und Laufweite per CSS.
 */
export function Unterzeile({ className }: { className?: string }) {
  return (
    <p className={cn("font-sans text-caption uppercase tracking-gesperrt text-text", className)}>Charge für Charge</p>
  );
}
