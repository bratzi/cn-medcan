import { cn } from "@/lib/cn";

/**
 * Textlinks (Spec TP2 3.10): Blattgrün mit Unterstrich, Hover über das
 * eigene Token statt über Deckkraft. Den Fokus zeichnet die globale Regel
 * in globals.css.
 */
export function textLinkKlassen(className?: string): string {
  return cn(
    "text-accent underline underline-offset-2 transition-colors duration-fast ease-standard hover:text-accent-hover",
    className,
  );
}

/**
 * Handelsnamen als Link in Listen (Inhaltsverzeichnis, Vorschläge,
 * Stimmzettel): Tinte, der Unterstrich zeigt den Link, beim Hover dunkelt
 * nur die Unterstrichfarbe nach (Guideline 7).
 */
export function namenLinkKlassen(className?: string): string {
  return cn(
    "text-text underline decoration-border-strong underline-offset-4 transition-colors duration-fast ease-standard hover:decoration-text",
    className,
  );
}
