import { cn } from "@/lib/cn";

export type SpinnerProps = {
  /** Wird vorgelesen und bei reduzierter Bewegung auch sichtbar gezeigt. */
  text?: string;
  className?: string;
};

/**
 * Ladeanzeige. Rotiert nur, wenn Bewegung erlaubt ist (`motion-safe`);
 * bei `prefers-reduced-motion: reduce` bleibt ein statischer Ring stehen und
 * der Statustext wird sichtbar, die Aussage haengt nie an der Animation.
 */
export function Spinner({ text = "Wird geladen", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-small text-text-muted", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-4 rounded-full border-2 border-border border-t-accent",
          "motion-safe:animate-spin",
        )}
      />
      <span className="motion-safe:sr-only">{text}</span>
    </span>
  );
}
