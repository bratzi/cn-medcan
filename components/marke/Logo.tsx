import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Halb durchsichtige Tönung, damit der Film durchscheint (Nutzer 2026-10-07); nur im Auftakt. */
  durchsichtig?: boolean;
};

/**
 * Das Logo "Book of Terpz" (Nutzer 2026-10-07): Pinselschrift, die Schrift in
 * Blattgrün (`accent`), das kleine "of" in Kopierstift-Violett. Die Form kommt
 * aus zwei Masken (public/marke/pinsel*.webp, globals.css .marke-pinsel),
 * die Farben aus den Tokens, deshalb geht das Logo mit Hell und Dunkel mit.
 * Mit `durchsichtig` sind die Farben halb durchsichtig (.marke-durchsichtig),
 * ohne Glaseffekt: die Schrift bleibt flach und scharfkantig.
 *
 * Die Breite setzt der Aufrufer; die Höhe folgt dem Seitenverhältnis. Für
 * Screenreader ist es ein Bild mit dem Namen "Book of Terpz".
 */
export function Logo({ className, durchsichtig = false }: Props) {
  return (
    <span
      role="img"
      aria-label="Book of Terpz"
      className={cn("marke-pinsel", durchsichtig && "marke-durchsichtig", className)}
    />
  );
}
