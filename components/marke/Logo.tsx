import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Glas wie die Glasobjekte im Storytelling (Nutzer 2026-10-07); nur im Auftakt. */
  glas?: boolean;
  "data-marke-zeile"?: string;
};

/**
 * Das Logo "Book of Terpz" (Nutzer 2026-10-07): Pinselschrift, die Schrift in
 * Blattgrün (`accent`), das kleine "of" in Kopierstift-Violett. Die Form kommt
 * aus zwei Masken (public/marke/pinsel*.webp, globals.css .marke-pinsel),
 * die Farben aus den Tokens, deshalb geht das Logo mit Hell und Dunkel mit.
 *
 * Mit `glas` liegt es als getöntes Glas da: halb durchsichtige Tönung, Glanz,
 * Lichtkante oben links und Schimmer unten rechts als eigene Masken, die der
 * Buchstabenform folgen, dazu ein farbiger Schein (globals.css .marke-glas).
 *
 * Die Breite setzt der Aufrufer; die Höhe folgt dem Seitenverhältnis. Für
 * Screenreader ist es ein Bild mit dem Namen "Book of Terpz".
 */
export function Logo({ className, glas = false, ...rest }: Props) {
  return (
    <span role="img" aria-label="Book of Terpz" className={cn("marke-pinsel", glas && "marke-glas", className)} {...rest}>
      {glas ? (
        <>
          <span aria-hidden="true" className="marke-glas-schatten" />
          <span aria-hidden="true" className="marke-glas-licht" />
        </>
      ) : null}
    </span>
  );
}
