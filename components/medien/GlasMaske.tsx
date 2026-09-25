import { cn } from "@/lib/cn";

/**
 * Glänzende Glasscheibe, die ein Bild oder Video teilweise verdeckt (Nutzer
 * 2026-09-26): getönt in Violett oder Grün, mit Glanzkante, schwingt langsam
 * mit (globals.css, .glas-maske). Rein dekorativ; der Aufrufer setzt Lage und
 * Größe, der Elternteil braucht `relative`. Mit `tiefe` folgt sie dem Zeiger
 * (bewegung/punkte.ts). Bei reduzierter Bewegung steht sie.
 */
export function GlasMaske({
  ton,
  tiefe,
  versatz,
  className,
}: {
  ton: "lila" | "gruen";
  tiefe?: string;
  /** Versatz gegen das Bild [x, y], z. B. ["14%", "12%"]: bei gleicher Größe deckt es so rund drei Viertel ab. */
  versatz?: readonly [string, string];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-punkt-tiefe={tiefe}
      style={versatz ? ({ "--glas-x": versatz[0], "--glas-y": versatz[1] } as React.CSSProperties) : undefined}
      className={cn("glas-maske", ton === "gruen" ? "glas-gruen" : "glas-lila", className)}
    />
  );
}
