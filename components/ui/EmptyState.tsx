import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  titel: string;
  beschreibung?: string;
  /** Optionale Aktion, z. B. ein Button oder Link zum Zuruecksetzen der Filter. */
  aktion?: ReactNode;
  className?: string;
};

/**
 * Leerer Zustand (Spec TP2 3.9): ein Satz in Newsreader, darunter was hier
 * entsteht oder was zu tun ist, hoechstens eine Aktion. Kein Kasten: die
 * Seite ist Papier, der leere Platz braucht keinen Rahmen.
 */
export function EmptyState({ titel, beschreibung, aktion, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-4 py-8", className)}>
      <div className="flex flex-col gap-2">
        <p className="font-buch text-h2 font-medium text-balance text-text">{titel}</p>
        {beschreibung ? (
          <p className="max-w-[56ch] text-body text-pretty text-text-muted">{beschreibung}</p>
        ) : null}
      </div>
      {aktion}
    </div>
  );
}
