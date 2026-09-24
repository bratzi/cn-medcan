import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Eine Fläche mit Bedeutung: hier schreibst du etwas (Formulare, Vorschlag).
 * Dieselbe Machart wie Doppelseite und Stimmzettel (Spec TP2 3.4), eckig.
 */
export function Blatt({ children, className, id }: Props) {
  return (
    <div
      id={id}
      className={cn("border border-border-strong bg-surface-raised p-6 shadow-md sm:p-8", className)}
    >
      {children}
    </div>
  );
}
