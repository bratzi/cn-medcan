import { cn } from "@/lib/cn";

/**
 * Die Unterzeile unter dem Logo (Spec TP3 6): gedruckt in Newsreader 500,
 * gespeichert in natürlicher Schreibung, Versalien und Laufweite per CSS.
 */
export function Unterzeile({ className }: { className?: string }) {
  return (
    <p className={cn("font-sans text-caption uppercase tracking-gesperrt text-text", className)}>Terpen für Terpen</p>
  );
}
