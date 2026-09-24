import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { medium } from "@/lib/medien";

type Props = {
  id: string;
  className?: string;
  /** Ziel fuer die StoryBuehne (data-story), z. B. "tag-drip". */
  story?: string;
  /**
   * Weiche Kanten: eine zweite, radiale Maskenebene (intersect) blendet den
   * Rand aus. Fuer Texturen als Hintergrund hinter Text, wo die Kante der
   * Maske sonst als Rechteck stehen bliebe.
   */
  weich?: boolean;
};

const WEICHER_RAND = "radial-gradient(closest-side, #000 55%, transparent)";

/** Wand-Textur: Alpha-Maske aus der Pipeline, eingefaerbt in spray. Rein dekorativ. */
export function Textur({ id, className, story, weich = false }: Props) {
  const m = medium(id);
  if (m.art !== "maske") throw new Error(`Medium "${id}" ist keine Maske`);
  const datei = `url(/medien/${m.datei}-maske.png)`;
  const maske = weich ? `${datei}, ${WEICHER_RAND}` : datei;
  const stil: CSSProperties = weich
    ? { maskImage: maske, WebkitMaskImage: maske, maskComposite: "intersect", WebkitMaskComposite: "source-in" }
    : { maskImage: maske, WebkitMaskImage: maske };
  return (
    <span
      aria-hidden="true"
      data-story={story}
      className={cn("wand-textur pointer-events-none block", className)}
      style={stil}
    />
  );
}
