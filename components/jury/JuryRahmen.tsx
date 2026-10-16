import type { ReactNode } from "react";

import { JuryFuss } from "@/components/jury/JuryFuss";
import { seitenRahmen } from "@/components/layout/Seitenkopf";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Rahmen jeder Jury-Seite: breite Spalte, Abstand zwischen den Abschnitten, HWG-Fuß. */
export function JuryRahmen({ texte, children }: { texte: Woerterbuch["jury"]; children: ReactNode }) {
  return (
    <div className={cn(seitenRahmen(), "flex flex-col gap-16 pt-16 pb-24 sm:pt-24")}>
      {children}
      <JuryFuss texte={texte} />
    </div>
  );
}
