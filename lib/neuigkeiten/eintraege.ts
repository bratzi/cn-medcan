/**
 * Meldungen der Seite /neu (Spec 2026-10-20-neuigkeiten-design.md).
 * Claude trägt nach jeder sichtbaren Auslieferung eine Meldung ein, neueste oben.
 * Kurze Sätze für Mitglieder ohne Technikwissen; tests/neuigkeiten.test.ts wacht
 * über Längen und verbotene Wörter.
 */

export type Art = "neu" | "besser" | "behoben";
export type Zweisprachig = { de: string; en: string };

export type Neuigkeit = {
  /** Stabil, kebab-case, mit Datum vorne. */
  id: string;
  /** ISO-Datum der Auslieferung. */
  datum: string;
  art: Art;
  titel: Zweisprachig;
  /** Ein bis drei kurze Sätze. */
  text: Zweisprachig;
  /** Seite, auf der man es sieht. */
  link?: string;
};

export type InArbeit = { id: string; titel: Zweisprachig; text: Zweisprachig };

export const NEUIGKEITEN: readonly Neuigkeit[] = [
  {
    id: "2026-10-20-neuigkeiten",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Diese Seite ist neu", en: "This page is new" },
    text: {
      de: "Hier steht ab jetzt, was sich am Book of Terpz ändert. Kurz und ohne Fachchinesisch.",
      en: "From now on, this is where you see what changes on Book of Terpz. Short and without jargon.",
    },
  },
];

export const IN_ARBEIT: readonly InArbeit[] = [];
