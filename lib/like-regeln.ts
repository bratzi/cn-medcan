import type { ZielArt } from "@/db/enums";

/** Ob ein Like zulässig ist. „weg“ heißt: Ziel fehlt oder ist nicht öffentlich (Spec Fehler und Grenzen). */
export function likeErlaubt(p: { art: ZielArt; zielId: string; ichId: string; zielAutorId: string | null; oeffentlich: boolean }): "ok" | "selbst" | "weg" {
  if (!p.oeffentlich) return "weg";
  if (p.zielAutorId === p.ichId) return "selbst";
  return "ok";
}
