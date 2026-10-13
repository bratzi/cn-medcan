import type { VertreiberRang } from "@/lib/profil-typen";

/**
 * Deine Vertreiber (Spec 2026-10-13): Qualitäts-Schnitt deiner Chargen je Vertreiber. Privat, keine Werbung (HWG).
 * Bestes Mittel zuerst, Gleichstand mehr Bewertungen, dann der Name. Getrennt nach Id, nicht nach Name.
 * Verglichen wird ungerundet; Bewertungen ohne Qualität zählen nicht.
 */
export function vertreiberRangliste(
  zeilen: readonly { vertreiberId: string | null; vertreiber: string | null; qualitaet: number | null }[],
  hoechstens = 5,
): VertreiberRang[] {
  const je = new Map<string, { name: string; summe: number; anzahl: number }>();
  for (const z of zeilen) {
    const name = z.vertreiber?.trim();
    if (!z.vertreiberId || !name || z.qualitaet === null) continue;
    const e = je.get(z.vertreiberId) ?? { name, summe: 0, anzahl: 0 };
    e.summe += z.qualitaet;
    e.anzahl += 1;
    je.set(z.vertreiberId, e);
  }
  return [...je]
    .map(([id, e]) => ({ id, name: e.name, roh: e.summe / e.anzahl, anzahl: e.anzahl }))
    .sort((a, b) => b.roh - a.roh || b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"))
    .slice(0, hoechstens)
    .map(({ id, name, roh, anzahl }) => ({ id, name, mittel: Math.round(roh * 10) / 10, anzahl }));
}
