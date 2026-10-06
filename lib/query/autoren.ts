/**
 * Wie viele Bewertungen ein Mitglied insgesamt geschrieben hat (Buch, Spec 2026-10-05):
 * freigegebene Bewertungen über alle Sorten. Je Mitglied und Sorte gibt es höchstens eine
 * (Unique-Index über Autor und Sorte), die Zahl zählt also Sorten.
 *
 * Eigene Abfrage statt Zählung in der Sortenabfrage: die Zahl ist Beiwerk. Scheitert sie,
 * fehlt nur die Zahl im Buch, nie die Seite.
 */

/** Eine Zeile aus der Gruppierung. */
export type AutorZahl = { autorId: string | null; anzahl: number };

/** Woher die Zahlen kommen; in Tests wird sie ersetzt. */
export type AutorZahlenQuelle = (autorIds: readonly string[]) => Promise<readonly AutorZahl[]>;

async function ausDerDatenbank(autorIds: readonly string[]): Promise<readonly AutorZahl[]> {
  // Erst hier geladen: Tests der reinen Teile brauchen weder Cloudflare noch den Prisma-Client.
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  const zeilen = await prisma.review.groupBy({
    by: ["autorId"],
    where: { autorId: { in: [...autorIds] }, freigegeben: true },
    _count: { _all: true },
  });
  return zeilen.map((zeile) => ({ autorId: zeile.autorId, anzahl: zeile._count._all }));
}

export function autorZahlen(zeilen: readonly AutorZahl[]): ReadonlyMap<string, number> {
  const karte = new Map<string, number>();
  for (const zeile of zeilen) {
    if (zeile.autorId !== null) karte.set(zeile.autorId, zeile.anzahl);
  }
  return karte;
}

export async function ladeAutorZahlen(
  autorIds: readonly string[],
  quelle: AutorZahlenQuelle = ausDerDatenbank,
): Promise<ReadonlyMap<string, number>> {
  const ids = [...new Set(autorIds)];
  if (ids.length === 0) return new Map();
  try {
    return autorZahlen(await quelle(ids));
  } catch {
    return new Map();
  }
}
