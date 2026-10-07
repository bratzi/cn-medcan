import type { Lieblingshersteller } from "@/lib/profil-typen";

/**
 * Lieblingshersteller (Spec Profil 10): der Hersteller mit dem höchsten Mittel
 * der eigenen Gesamtnoten, ab 2 eigenen Bewertungen. Gleichstand: mehr
 * Bewertungen zuerst, dann der Name. Verglichen wird ungerundet.
 */
export function lieblingshersteller(zeilen: readonly { hersteller: string | null; note: number }[]): Lieblingshersteller | null {
  const je = new Map<string, { summe: number; anzahl: number }>();
  for (const z of zeilen) {
    const name = z.hersteller?.trim();
    if (!name) continue;
    const e = je.get(name) ?? { summe: 0, anzahl: 0 };
    e.summe += z.note;
    e.anzahl += 1;
    je.set(name, e);
  }
  const kandidaten = [...je]
    .filter(([, e]) => e.anzahl >= 2)
    .map(([name, e]) => ({ name, mittel: e.summe / e.anzahl, anzahl: e.anzahl }))
    .sort((a, b) => b.mittel - a.mittel || b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"));
  const erster = kandidaten[0];
  return erster ? { name: erster.name, mittel: Math.round(erster.mittel * 10) / 10, anzahl: erster.anzahl } : null;
}
