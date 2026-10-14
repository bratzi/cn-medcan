/**
 * Seiten-Cursor für Kommentare: (erstelltAm, id) als ein Text "<ISO>|<id>".
 * Die Id bricht Gleichstände derselben Millisekunde, damit keine Zeile an der Seitengrenze fehlt.
 */
export type KommentarCursor = { erstelltAm: Date; id: string };

export function cursorKodieren(c: { erstelltAm: Date; id: string }): string {
  return `${c.erstelltAm.toISOString()}|${c.id}`;
}

/** Kaputte oder fehlende Cursor ergeben null (= von vorn). */
export function cursorLesen(roh: unknown): KommentarCursor | null {
  if (typeof roh !== "string" || roh.length > 100) return null;
  const teile = roh.split("|");
  if (teile.length !== 2 || !teile[1]) return null;
  const zeit = new Date(teile[0]);
  if (Number.isNaN(zeit.getTime()) || zeit.toISOString() !== teile[0]) return null;
  return { erstelltAm: zeit, id: teile[1] };
}
