import { formatiereDatum } from "@/lib/format";

/** Zeitraum einer Runde in Worten, ohne Gedankenstrich (Spec TP2 4.2). */
export function rundenZeitraum(start: Date, ende: Date | null): string {
  return ende ? `${formatiereDatum(start)} bis ${formatiereDatum(ende)}` : `seit ${formatiereDatum(start)}`;
}
