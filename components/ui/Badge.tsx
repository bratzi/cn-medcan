import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariante = "neutral" | "success" | "warning" | "danger" | "accent";

const VARIANTEN: Record<BadgeVariante, string> = {
  neutral: "border-border-strong bg-surface-raised text-text-muted",
  success: "border-success bg-surface-raised text-success",
  // Tinte statt warning/accent: beide erreichen als 13-px-Text hell keine 4.5:1
  // (npm run farben); den Zustand tragen Rahmen, Flaeche und Marker.
  warning: "border-warning bg-surface-raised text-text",
  danger: "border-danger bg-surface-raised text-danger",
  accent: "border-accent bg-accent-subtle text-text",
};

/**
 * Formunterschiedliche Marker (keine Emoji, keine Icon-Font). In Graustufen
 * bleibt der Zustand allein am Zeichen und am Klartext erkennbar.
 */
const STANDARD_ZEICHEN: Record<BadgeVariante, string | undefined> = {
  neutral: undefined,
  success: "✓", // Haken
  warning: "!",
  danger: "×", // Multiplikationszeichen
  accent: "•", // Punkt
};

export type BadgeProps = {
  children: ReactNode;
  variante?: BadgeVariante;
  /** Ueberschreibt den Standard-Marker; `false` entfernt ihn. */
  zeichen?: string | false;
  title?: string;
  className?: string;
};

export function Badge({
  children,
  variante = "neutral",
  zeichen,
  title,
  className,
}: BadgeProps) {
  const marker = zeichen === false ? undefined : (zeichen ?? STANDARD_ZEICHEN[variante]);

  return (
    <span
      title={title}
      className={cn(
        // gap-1/py-1 = 4px: optische Korrektur innerhalb des Marker/Text-Paares.
        // 8px wuerde den Marker vom Wort loesen und das Badge (16px Zeile)
        // auf 32px aufblasen, womit es neben 16px-Fliesstext nicht mehr sitzt.
        // whitespace-nowrap: eine umbrechende Pille sieht kaputt aus.
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-caption whitespace-nowrap",
        VARIANTEN[variante],
        className,
      )}
    >
      {marker ? (
        <span aria-hidden="true" className="leading-none">
          {marker}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}
