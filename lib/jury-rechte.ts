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
