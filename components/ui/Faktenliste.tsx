import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Fakt = { begriff: string; wert: ReactNode };

/**
 * Begriff und Wert paarweise wie im Feldbuch (Spec TP2 3.5). Bewusst ein
 * `dl`: keine Tabelle (nur eine Spalte Werte) und keine bloße Liste.
 */
export function Faktenliste({ zeilen, className }: { zeilen: readonly Fakt[]; className?: string }) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {zeilen.map((zeile) => (
        <div
          key={zeile.begriff}
          className="grid grid-cols-1 gap-2 border-t border-border py-4 sm:grid-cols-[16rem_1fr] sm:gap-8"
        >
          <dt className="text-small text-text-muted">{zeile.begriff}</dt>
          <dd className="min-w-0 text-body text-text">{zeile.wert}</dd>
        </div>
      ))}
    </dl>
  );
}
