import { revalidatePath } from "next/cache";

import { SPRACHEN } from "./sprache-kern";

/**
 * Revalidiert einen Pfad in jeder Sprache ("/" wird zu /de und /en, "/admin" zu /de/admin und /en/admin).
 * Seit Session 54 mit D1-Tag-Cache: das trifft auch die KV-Einträge der statischen Seiten.
 * `typ: "layout"` nimmt alle Seiten darunter mit (etwa /reviews samt /reviews/band/[n]).
 */
export function revalidiereSprachen(pfad: string, typ?: "layout" | "page"): void {
  for (const sprache of SPRACHEN) revalidatePath(pfad === "/" ? `/${sprache}` : `/${sprache}${pfad}`, typ);
}
