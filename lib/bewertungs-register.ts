import { ersatzBildId } from "@/lib/bewertungsbilder";
import { noteOderErsatz } from "@/lib/profil";
import type { RegisterZeile } from "@/lib/profil-typen";

export const SORTIERUNGEN = ["datum", "note", "abstand"] as const;
export type Sortierung = (typeof SORTIERUNGEN)[number];

/** So viele Einträge stehen, bis jemand „Alle zeigen“ wählt (Spec 6). */
export const REGISTER_ANFANG = 10;

export type RegisterEintrag = {
  slug: string;
  handelsname: string;
  note: number;
  datum: Date;
  community: { mittel: number; anzahl: number } | null;
  /** eigene − Community; null ohne Community-Wert. */
  abstand: number | null;
  bild: { art: "medium"; id: string } | { art: "eigen"; id: string; breite: number; hoehe: number; offen: boolean };
};

const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);

/** Liest `?sortierung=` und `?alle=1`; alles andere fällt auf Datum und den Anfang zurück. */
export function registerParameter(sp: Record<string, string | string[] | undefined>): { sortierung: Sortierung; alle: boolean } {
  const s = erster(sp.sortierung);
  return {
    sortierung: (SORTIERUNGEN as readonly string[]).includes(s ?? "") ? (s as Sortierung) : "datum",
    alle: erster(sp.alle) === "1",
  };
}

/** Sortiert und kürzt das Register (Spec 6). Richtung je Sortierung fest. */
export function registerAnsicht(
  zeilen: readonly RegisterZeile[],
  { sortierung, alle }: { sortierung: Sortierung; alle: boolean },
): { eintraege: RegisterEintrag[]; gesamt: number } {
  const eintraege: RegisterEintrag[] = zeilen.map((z) => {
    const note = noteOderErsatz(z);
    const c = z.community && z.community.mittel !== null && z.community.anzahl > 0 ? { mittel: z.community.mittel, anzahl: z.community.anzahl } : null;
    return {
      slug: z.slug,
      handelsname: z.handelsname,
      note,
      datum: z.erstelltAm,
      community: c,
      abstand: c ? note - c.mittel : null,
      bild: z.eigenesBild ? { art: "eigen", ...z.eigenesBild } : { art: "medium", id: ersatzBildId(z.bildPfad, z.slug) },
    };
  });
  const nachDatum = (a: RegisterEintrag, b: RegisterEintrag) => b.datum.getTime() - a.datum.getTime();
  const vergleich: Record<Sortierung, (a: RegisterEintrag, b: RegisterEintrag) => number> = {
    datum: nachDatum,
    note: (a, b) => b.note - a.note || nachDatum(a, b),
    abstand: (a, b) =>
      (a.abstand === null ? 1 : 0) - (b.abstand === null ? 1 : 0) ||
      Math.abs(b.abstand ?? 0) - Math.abs(a.abstand ?? 0) ||
      nachDatum(a, b),
  };
  eintraege.sort(vergleich[sortierung]);
  return { eintraege: alle ? eintraege : eintraege.slice(0, REGISTER_ANFANG), gesamt: eintraege.length };
}
