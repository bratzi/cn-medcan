import { cn } from "@/lib/cn";

import { FELD_SPALTEN, type FeldSpalten } from "./Feld";

const HOEHE = { klein: "h-40", mittel: "h-80", gross: "h-120" } as const;

/** Platzhalter in der Form des Felds, solange es streamt (Spec 9). */
export function FeldSkelett({ spalten, hoehe = "mittel" }: { spalten: FeldSpalten; hoehe?: keyof typeof HOEHE }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "col-span-4 flex flex-col gap-6 border-t border-l border-t-border-strong border-l-border bg-surface p-6 min-[1080px]:p-8",
        FELD_SPALTEN[spalten],
      )}
    >
      <div className="h-6 w-40 bg-surface-sunken" />
      <div className={cn("w-full bg-surface-sunken", HOEHE[hoehe])} />
    </div>
  );
}
