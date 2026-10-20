import type { KatalogDaten } from "@/lib/katalog/typen";

/** Ladezustand der Katalog-Insel: vor „bereit“ bleibt die Startliste stehen, Filter sind aus. */
export type Ladezustand = { art: "start" } | { art: "laedt" } | { art: "bereit"; daten: KatalogDaten } | { art: "fehler" };
export type Ereignis = { typ: "laden" } | { typ: "geladen"; daten: KatalogDaten } | { typ: "fehlgeschlagen" };

export function weiter(z: Ladezustand, e: Ereignis): Ladezustand {
  switch (e.typ) {
    case "laden":
      return z.art === "bereit" ? z : { art: "laedt" };
    case "geladen":
      return { art: "bereit", daten: e.daten };
    case "fehlgeschlagen":
      return z.art === "bereit" ? z : { art: "fehler" };
  }
}

export function filterDeaktiviert(z: Ladezustand): boolean {
  return z.art !== "bereit";
}
