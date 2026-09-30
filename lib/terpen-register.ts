import { GESCHMACKS_KATEGORIEN, type GeschmacksKategorie } from "@/db/enums";
import { aromaAnteile, BEGLEITSTOFFE, type AromaAnteil } from "@/lib/terpen-aromen";

/**
 * Das Register "Terpene und Geschmäcker" der Startseite (T12, Nutzer
 * 2026-09-29): jedes Terpen des Katalogs mit seinen Noten und der Zahl
 * unserer Sorten, dazu je Geschmacksachse die Terpene, die sie tragen. Rein,
 * damit es ohne Datenbank testbar ist; gerechnet wird über höchstens einige
 * Dutzend Terpene mal zehn Achsen, das bleibt weit unter dem CPU-Limit.
 * Nur Duft und Geschmack, keine Wirkung (HWG).
 */
export type KatalogEintrag = { name: string; geschmack: GeschmacksKategorie; sorten: number };

export type RegisterTerpen = {
  name: string;
  /** Kleingeschrieben, Schlüssel in die Wörterbücher (aroma.satz, start.register.terpene). */
  schluessel: string;
  /** Sichere id für aria-controls. */
  anker: string;
  noten: readonly AromaAnteil[];
  sorten: number;
};

export type RegisterNote = {
  geschmack: GeschmacksKategorie;
  anker: string;
  terpene: readonly { name: string; schluessel: string; anker: string; anteil: number; sorten: number }[];
  begleitstoffe: readonly { name: string; anteil: number }[];
};

export type TerpenRegister = { terpene: readonly RegisterTerpen[]; noten: readonly RegisterNote[] };

function ankerTeil(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** id der Tafel einer Geschmacksachse; die Terpen-Tafel verweist mit derselben Regel darauf. */
export function notenAnker(geschmack: GeschmacksKategorie): string {
  return `register-note-${ankerTeil(geschmack)}`;
}

function sortenZahl(wert: number): number {
  return Number.isFinite(wert) && wert > 0 ? Math.round(wert) : 0;
}

export function baueTerpenRegister(katalog: readonly KatalogEintrag[]): TerpenRegister {
  const terpene: RegisterTerpen[] = katalog
    .map((eintrag) => ({
      name: eintrag.name,
      schluessel: eintrag.name.trim().toLowerCase(),
      anker: `register-terpen-${ankerTeil(eintrag.name)}`,
      noten: aromaAnteile(eintrag),
      sorten: sortenZahl(eintrag.sorten),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const noten: RegisterNote[] = GESCHMACKS_KATEGORIEN.map((geschmack) => ({
    geschmack,
    anker: notenAnker(geschmack),
    terpene: terpene
      .flatMap((terpen) => {
        const note = terpen.noten.find((n) => n.geschmack === geschmack);
        return note
          ? [{ name: terpen.name, schluessel: terpen.schluessel, anker: terpen.anker, anteil: note.anteil, sorten: terpen.sorten }]
          : [];
      })
      .sort((a, b) => b.anteil - a.anteil || a.name.localeCompare(b.name, "de")),
    begleitstoffe: BEGLEITSTOFFE.flatMap((stoff) => {
      const note = stoff.noten.find((n) => n.geschmack === geschmack);
      return note ? [{ name: stoff.name, anteil: note.anteil }] : [];
    }),
  })).filter((note) => note.terpene.length > 0 || note.begleitstoffe.length > 0);

  return { terpene, noten };
}
