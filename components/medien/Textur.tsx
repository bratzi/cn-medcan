import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { medium } from "@/lib/medien";

type Props = {
  id: string;
  className?: string;
  /** Ziel fuer die StoryBuehne (data-story), z. B. "tag-drip". */
  story?: string;
};

/** Wand-Textur: Alpha-Maske aus der Pipeline, eingefaerbt in spray. Rein dekorativ. */
export function Textur({ id, className, story }: Props) {
  const m = medium(id);
  if (m.art !== "maske") throw new Error(`Medium "${id}" ist keine Maske`);
  const maske = `url(/medien/${m.datei}-maske.png)`;
  const stil: CSSProperties = { maskImage: maske, WebkitMaskImage: maske };
  return (
    <span
      aria-hidden="true"
      data-story={story}
      className={cn("wand-textur pointer-events-none block", className)}
      style={stil}
    />
  );
}
