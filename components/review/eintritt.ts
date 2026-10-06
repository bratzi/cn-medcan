import type { CSSProperties } from "react";

/**
 * Reihenfolge beim Einzug einer Buchseite (globals.css, `[data-eintritt]`): `--i` ist der Platz
 * in der Staffel, die Verzögerung rechnet das CSS daraus.
 */
export const ablauf = (platz: number): CSSProperties => ({ "--i": platz }) as CSSProperties;
