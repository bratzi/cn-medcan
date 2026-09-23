/**
 * Erkennt die Prisma-Fehler, die in dieser Codebasis fachlich etwas bedeuten.
 *
 * Hintergrund: D1 hat keine Transaktionen. Eindeutigkeit wird deshalb ueber
 * Unique-Indizes abgesichert, und ein Verstoss dagegen ist kein technischer
 * Unfall, sondern die erwartete Antwort der Datenbank auf "das gibt es
 * schon" - zum Beispiel bei der zweiten Stimme desselben Mitglieds. Wer
 * stattdessen vor dem Schreiben prueft, baut eine Race Condition.
 */

/** Verstoss gegen einen Unique-Index (Prisma P2002). */
export function istEindeutigkeitsfehler(fehler: unknown): boolean {
  return typeof fehler === "object" && fehler !== null && "code" in fehler
    ? (fehler as { code?: unknown }).code === "P2002"
    : false;
}

/**
 * Abbruch durch einen Trigger aus db/constraints.sql.
 *
 * Prisma reicht den SQLite-Fehler als Rohtext durch; einen eigenen Code gibt
 * es dafuer nicht. Der Text traegt die Meldung aus `raise(abort, ...)`.
 */
export function triggerMeldung(fehler: unknown): string | null {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  const treffer = /SQLITE_CONSTRAINT_TRIGGER[^:]*:?\s*(.*)/.exec(text);
  return treffer?.[1]?.trim() || (text.includes("SQLITE_CONSTRAINT_TRIGGER") ? text : null);
}
