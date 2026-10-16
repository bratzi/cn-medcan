export function darfBearbeiten(b: { autorId: string; status: string }, m: { mitgliedId: string; jury: boolean; rolle: string }): boolean {
  if (m.rolle === "ADMIN") return true;
  return m.jury && b.autorId === m.mitgliedId && b.status === "ENTWURF";
}

export function darfVerknuepfen(r: { autorId: string | null; freigegeben: boolean } | null, mitgliedId: string): boolean {
  return !!r && r.freigegeben && r.autorId === mitgliedId;
}
