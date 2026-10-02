import { revalidatePath } from "next/cache";

import { SPRACHEN } from "./sprache-kern";

/**
 * Revalidiert einen Pfad in jeder Sprache ("/" wird zu /de und /en, "/admin" zu /de/admin und /en/admin).
 * Ohne Tag-Cache trifft das derzeit nur den Router-Cache; die KV-Einträge laufen zeitbasiert ab.
 */
export function revalidiereSprachen(pfad: string): void {
  for (const sprache of SPRACHEN) revalidatePath(pfad === "/" ? `/${sprache}` : `/${sprache}${pfad}`);
}
