import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  titel: string;
  beschreibung?: string;
  /** Optionale Aktion, z. B. ein Button oder Link zum Zuruecksetzen der Filter. */
  aktion?: ReactNode;
  className?: string;
};

/** Leerer Zustand, z. B. "keine Treffer". Ohne Emoji, ohne Dekor-Illustration. */
export function EmptyState({ titel, beschreibung, aktion, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 rounded-lg border border-border bg-surface-raised px-6 py-8",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <p className="text-h3 text-text">{titel}</p>
        {beschreibung ? (
          <p className="max-w-[68ch] text-body text-text-muted">{beschreibung}</p>
        ) : null}
      </div>
      {aktion}
    </div>
  );
}
