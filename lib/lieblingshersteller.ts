import type { HerstellerRang } from "@/lib/profil-typen";

/**
 * Deine Hersteller (Spec 2026-10-09 C, vorher nur ein Liebling ab 2 Bewertungen): alle Hersteller mit
 * eigener Bewertung, bestes Mittel zuerst, Gleichstand mehr Bewertungen, dann der Name. Getrennt nach Id,
 * nicht nach Name. Verglichen wird ungerundet. Privat, keine Werbung (HWG).
 */
export function herstellerRangliste(
  zeilen: readonly { herstellerId: string | null; hersteller: string | null; note: number }[],
  hoechstens = 5,
): HerstellerRang[] {
  const je = new Map<string, { name: string; summe: number; anzahl: number }>();
  for (const z of zeilen) {
    const name = z.hersteller?.trim();
    if (!z.herstellerId || !name) continue;
    const e = je.get(z.herstellerId) ?? { name, summe: 0, anzahl: 0 };
    e.summe += z.note;
    e.anzahl += 1;
    je.set(z.herstellerId, e);
  }
  return [...je]
    .map(([id, e]) => ({ id, name: e.name, roh: e.summe / e.anzahl, anzahl: e.anzahl }))
    .sort((a, b) => b.roh - a.roh || b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"))
    .slice(0, hoechstens)
    .map(({ id, name, roh, anzahl }) => ({ id, name, mittel: Math.round(roh * 10) / 10, anzahl }));
}
