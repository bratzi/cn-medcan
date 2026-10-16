import { JURY_BILDER_MAX } from "@/lib/jury";

export function darfBearbeiten(b: { autorId: string; status: string }, m: { mitgliedId: string; jury: boolean; rolle: string }): boolean {
  if (m.rolle === "ADMIN") return true;
  return m.jury && b.autorId === m.mitgliedId && b.status === "ENTWURF";
}

/** Einreichen geht nur aus dem Entwurf: ein veröffentlichter Beitrag fällt so nicht zurück. */
export function darfEinreichen(b: { autorId: string; status: string }, m: { mitgliedId: string; jury: boolean; rolle: string }): boolean {
  return b.status === "ENTWURF" && darfBearbeiten(b, m);
}

export function darfVerknuepfen(r: { autorId: string | null; freigegeben: boolean } | null, mitgliedId: string): boolean {
  return !!r && r.freigegeben && r.autorId === mitgliedId;
}

/**
 * Bilder eines Jury-Beitrags hochladen, löschen, ordnen: wer den Beitrag bearbeiten darf (Admin immer, Jury nur
 * den eigenen Entwurf, auch nach „zurückgegeben“). Mit `anzahl` (Upload) zusätzlich die Obergrenze, die auch
 * für Admins gilt.
 */
export function bildRecht(
  b: { autorId: string; status: string } | null,
  m: { mitgliedId: string; jury: boolean; rolle: string },
  anzahl?: number,
): "ok" | "recht" | "voll" {
  if (!b || !darfBearbeiten(b, m)) return "recht";
  if (anzahl !== undefined && anzahl >= JURY_BILDER_MAX) return "voll";
  return "ok";
}

/** Vorschau nicht veröffentlichter Jury-Bilder: Betreiber und Autorin oder Autor des Beitrags. */
export function darfBildSehen(b: { autorId: string } | null, m: { mitgliedId: string; rolle: string }): boolean {
  return !!b && (m.rolle === "ADMIN" || b.autorId === m.mitgliedId);
}
