import { refresh, revalidateTag } from "next/cache";

import { SPRACHEN } from "./sprache-kern";

/** Präfix der impliziten Pfad-Tags in Next (NEXT_CACHE_IMPLICIT_TAG_ID, next/dist/lib/constants.js). */
const PFAD_TAG = "_N_T_";

/**
 * Die Tags, die `revalidatePath` für einen Pfad in jeder Sprache setzen würde
 * ("/" wird zu /de und /en, "/admin" zu /de/admin und /en/admin; mit `typ` hängt "/layout" bzw. "/page" an,
 * genau wie revalidatePath in next/dist/server/web/spec-extension/revalidate.js).
 */
export function sprachTags(pfad: string, typ?: "layout" | "page"): string[] {
  return SPRACHEN.map((sprache) => {
    const ziel = (pfad === "/" ? `/${sprache}` : `/${sprache}${pfad}`).replace(/\/+$/, "");
    return typ ? `${PFAD_TAG}${ziel}/${typ}` : `${PFAD_TAG}${ziel}`;
  });
}

/**
 * Markiert einen Pfad in jeder Sprache als veraltet (stale-while-revalidate).
 * `typ: "layout"` nimmt alle Seiten darunter mit (etwa /reviews samt /reviews/band/[n]).
 *
 * Plan 2026-10-20 (Vorrendern): früher `revalidatePath`. Das meldet die Tags ohne Profil, OpenNext
 * 1.20.6 trägt dann `expire = now` in den D1-Tag-Cache ein, und der nächste Besucher bekam einen
 * Cache-Miss und baute die Seite im Request (CPU-Limit, 1102). `revalidateTag(tag, "max")` setzt
 * dieselben impliziten Pfad-Tags nur auf stale: der Besucher bekommt die bisherige Seite, der Neubau
 * läuft im Hintergrund. `refresh()` sorgt in Server Actions dafür, dass der Client seine dynamischen
 * Daten neu holt (revalidateTag mit Profil setzt pathWasRevalidated bewusst nicht); außerhalb von
 * Actions (Cron, Route Handler) wirft refresh und wird übersprungen.
 */
export function revalidiereSprachen(pfad: string, typ?: "layout" | "page"): void {
  for (const tag of sprachTags(pfad, typ)) revalidateTag(tag, "max");
  try {
    refresh();
  } catch {
    // keine Server Action: nichts am Client aufzufrischen
  }
}
