/** Bereiche der Verwaltung (Spec 2026-10-16 Admin-Dashboard). Reihenfolge = Grundreihenfolge der Leiste. */
export type AdminBereich = "bewertungen" | "mitglieder" | "gemeldet" | "budpics" | "vorschlaege" | "jury" | "instagram" | "abstimmung" | "kennwerte" | "hersteller";

export const ADMIN_BEREICHE = [
  { id: "bewertungen", titel: "Bewertungen", href: "/admin/bewertungen", zaehlt: true },
  { id: "mitglieder", titel: "Mitglieder", href: "/admin/mitglieder", zaehlt: true },
  { id: "gemeldet", titel: "Gemeldet", href: "/admin/gemeldet", zaehlt: true },
  { id: "budpics", titel: "Budpics", href: "/admin/budpics", zaehlt: true },
  { id: "vorschlaege", titel: "Vorschläge", href: "/admin/vorschlaege", zaehlt: true },
  { id: "jury", titel: "Jury", href: "/admin/jury", zaehlt: true },
  { id: "instagram", titel: "Instagram", href: "/admin/instagram", zaehlt: true },
  { id: "abstimmung", titel: "Abstimmung", href: "/admin/abstimmung", zaehlt: false },
  { id: "kennwerte", titel: "Kennwerte", href: "/admin/kennwerte", zaehlt: false },
  { id: "hersteller", titel: "Hersteller", href: "/admin/hersteller", zaehlt: false },
] as const satisfies readonly { id: AdminBereich; titel: string; href: string; zaehlt: boolean }[];

/** null = Abfrage gescheitert (Kachel zeigt „–“). */
export type AdminZaehler = Partial<Record<AdminBereich, number | null>>;

export function kachelReihenfolge(z: AdminZaehler) {
  const offen = (id: AdminBereich) => z[id] ?? 0;
  const mitZahl = ADMIN_BEREICHE.filter((b) => b.zaehlt && offen(b.id) > 0).sort((a, b) => offen(b.id) - offen(a.id));
  return [...mitZahl, ...ADMIN_BEREICHE.filter((b) => !mitZahl.includes(b))];
}

export function summeOffen(z: AdminZaehler): number {
  return ADMIN_BEREICHE.reduce((s, b) => s + (b.zaehlt ? (z[b.id] ?? 0) : 0), 0);
}

export async function sicherZaehlen(f: () => Promise<number>): Promise<number | null> {
  try {
    return await f();
  } catch (fehler) {
    console.error("Admin-Zähler fehlgeschlagen", fehler);
    return null;
  }
}
