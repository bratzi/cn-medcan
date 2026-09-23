import { cn } from "@/lib/cn";

type Props = {
  groesse: "kopf" | "buehne";
  className?: string;
};

/**
 * Die Marke "Grünes Buch" (Spec 4.3).
 *
 * kopf:   Wortmarke in Cormorant 500 mit kleinem "gb"-Tag als Aufkleber
 *         darüber (Kopf und Fuß). Der Name ist Text, das Tag aria-hidden.
 * buehne: nur der Aufkleber (Tag, darunter gesperrte Versalien) am
 *         Auftakt-Titel. Dort trägt die Überschrift den Namen, deshalb ist
 *         der ganze Aufkleber aria-hidden.
 */
export function Wortmarke({ groesse, className }: Props) {
  if (groesse === "buehne") {
    return (
      <span aria-hidden="true" data-story="tag" className={cn("gb-aufkleber inline-flex", className)}>
        {/* gap-1 = 4px: Tag und Versalienzeile sind ein Zeichen, 8px risse es auseinander. */}
        <span className="gb-kontur inline-flex -rotate-6 flex-col items-center gap-1 px-2">
          <span className="gb-tag font-wand text-tag">gb</span>
          <span className="font-sans text-caption uppercase tracking-gesperrt text-text">
            Grünes Buch
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex items-end pt-4 pl-4", className)}>
      <span className="relative font-buch text-wortmarke text-text">Grünes Buch</span>
      <span aria-hidden="true" className="gb-aufkleber absolute top-0 left-0 z-10">
        <span className="gb-kontur inline-flex -rotate-12">
          <span className="gb-tag font-wand text-h2 font-normal">gb</span>
        </span>
      </span>
    </span>
  );
}
