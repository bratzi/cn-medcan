import type { EmpfehlungsEintrag } from "@/components/empfehlung/EmpfehlungsListe";
import type { BudpicZugang } from "@/components/produkt/BudpicBeitragen";
import type { StimmZustand } from "@/components/umfrage/UmfrageKarte";
import { stimmZustand } from "@/components/umfrage/stimmzustand";

/**
 * Die nutzerbezogenen Teile der statischen Startseite (Spec 2026-10-01,
 * statische Seiten, 4.3): was /api/startseite liefert und welche Variante die
 * Inseln im Browser daraus zeigen. Reine Funktionen, im Route Handler und im
 * Browser dieselben.
 */
export type StartseitenSitzung = {
  /** umfrageId: die laufende Runde laut Datenbank; null ohne Runde und für Gäste. */
  abstimmung: { umfrageId: string | null; zustand: StimmZustand };
  empfehlungen: { art: "GAST" } | { art: "LISTE"; eintraege: EmpfehlungsEintrag[] };
  budpicZugang: BudpicZugang;
};

export type SitzungsStand =
  | { status: "laedt" }
  | { status: "fehler" }
  | { status: "fertig"; daten: StartseitenSitzung };

export function sitzungsAntwort(eingabe: {
  mitglied: { freigegeben: boolean } | null;
  umfrageId: string | null;
  eigeneOptionId: string | null;
  empfehlungen: readonly EmpfehlungsEintrag[];
}): StartseitenSitzung {
  const { mitglied } = eingabe;
  if (!mitglied) {
    return {
      abstimmung: { umfrageId: eingabe.umfrageId, zustand: { art: "ANONYM" } },
      empfehlungen: { art: "GAST" },
      budpicZugang: "gast",
    };
  }
  return {
    abstimmung: { umfrageId: eingabe.umfrageId, zustand: stimmZustand(mitglied, eingabe.eigeneOptionId) },
    empfehlungen: { art: "LISTE", eintraege: [...eingabe.empfehlungen] },
    budpicZugang: mitglied.freigegeben ? "freigegeben" : "mitglied",
  };
}

export type StimmzettelAnzeige = StimmZustand["art"] | "laedt" | "fehler" | "veraltet";

/**
 * Welche Aktionszeile der statische Stimmzettel zeigt. "veraltet": Die Seite
 * kommt aus dem Cache (bis 300 s alt) und zeigt eine andere Runde als die
 * laufende; dann führt ein Link auf /umfragen statt eines falschen Zustands.
 */
export function stimmzettelAnzeige(stand: SitzungsStand, umfrageId: string): StimmzettelAnzeige {
  if (stand.status === "laedt") return "laedt";
  if (stand.status === "fehler") return "fehler";
  const { umfrageId: laufend, zustand } = stand.daten.abstimmung;
  if (zustand.art === "ANONYM") return "ANONYM";
  return laufend === umfrageId ? zustand.art : "veraltet";
}

/** Ob die eigene Stimme auf dieser Option der gezeigten Runde liegt (Vermerk und Badge). */
export function eigeneStimmeAuf(stand: SitzungsStand, umfrageId: string, optionId: string): boolean {
  if (stand.status !== "fertig") return false;
  const { umfrageId: laufend, zustand } = stand.daten.abstimmung;
  return laufend === umfrageId && zustand.art === "ABGESTIMMT" && zustand.optionId === optionId;
}

export type EmpfehlungenAnzeige =
  | { art: "laedt" }
  | { art: "fehler" }
  | { art: "gast" }
  | { art: "leer" }
  | { art: "liste"; eintraege: EmpfehlungsEintrag[] };

export function empfehlungenAnzeige(stand: SitzungsStand): EmpfehlungenAnzeige {
  if (stand.status === "laedt") return { art: "laedt" };
  if (stand.status === "fehler") return { art: "fehler" };
  const { empfehlungen } = stand.daten;
  if (empfehlungen.art === "GAST") return { art: "gast" };
  return empfehlungen.eintraege.length === 0 ? { art: "leer" } : { art: "liste", eintraege: empfehlungen.eintraege };
}
