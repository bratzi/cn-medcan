import { z } from "zod";

import {
  DARREICHUNGSFORMEN,
  GESCHMACKS_KATEGORIEN,
  KULTIVAR_TYPEN,
} from "@/db/enums";

/** Treffer pro Seite in der Katalogliste. */
export const TREFFER_PRO_SEITE = 24;

export const SORTIERUNGEN = [
  "community",
  "stimmen",
  "neueste",
  "name",
  "thc_absteigend",
  "thc_aufsteigend",
  "preis_aufsteigend",
  "relevanz",
] as const;

/** Wählbare Mindestnoten der Community (Spec 2026-10-20 Blütenseite). */
export const NOTEN_STUFEN = [3, 3.5, 4, 4.5] as const;

export type Sortierung = (typeof SORTIERUNGEN)[number];

export type Richtung = "auf" | "ab";

/** Richtung ohne Angabe in der URL: wie die Sortierung bisher lief. */
export function standardRichtung(s: Sortierung): Richtung {
  return s === "name" || s === "thc_aufsteigend" || s === "preis_aufsteigend" ? "auf" : "ab";
}

/** Tatsächliche Richtung eines Filters. */
export function aktiveRichtung(f: { sortierung: Sortierung; richtung?: Richtung }): Richtung {
  return f.richtung ?? standardRichtung(f.sortierung);
}

const THC_MIN_DEFAULT = 0;
const THC_MAX_DEFAULT = 100;

/**
 * Hilfsschema fuer kommaseparierte Enum-Listen in der URL
 * (z. B. ?typ=INDICA,HYBRID). Unbekannte Werte werden still verworfen,
 * nicht als Fehler behandelt.
 */
function enumListe<T extends string>(werte: readonly T[]) {
  const erlaubt = new Set<string>(werte);
  return z
    .unknown()
    .transform((rohwert) => {
      const teile = (Array.isArray(rohwert) ? rohwert : [rohwert])
        .filter((teil): teil is string => typeof teil === "string")
        .flatMap((teil) => teil.split(","))
        .map((teil) => teil.trim().toUpperCase())
        .filter((teil) => erlaubt.has(teil)) as T[];
      // Duplikate entfernen, damit `in` keine unnoetigen Werte bekommt.
      return [...new Set(teile)];
    })
    .catch([] as T[]);
}

/** Slug-Liste (Apotheken). Nur konservative Zeichen, damit kein Muell in `in` landet. */
const slugListe = z
  .unknown()
  .transform((rohwert) => {
    const teile = (Array.isArray(rohwert) ? rohwert : [rohwert])
      .filter((teil): teil is string => typeof teil === "string")
      .flatMap((teil) => teil.split(","))
      .map((teil) => teil.trim().toLowerCase())
      .filter((teil) => /^[a-z0-9-]{1,80}$/.test(teil));
    // D1 erlaubt hoechstens 100 gebundene Parameter je Statement; eine manipulierte URL mit
    // vielen Slugs darf die Bluetenansicht nicht in einen Fehler laufen lassen.
    return [...new Set(teile)].slice(0, 20);
  })
  .catch([] as string[]);

function ersterWert(rohwert: unknown): string | undefined {
  if (typeof rohwert === "string") return rohwert;
  if (Array.isArray(rohwert)) {
    const treffer = rohwert.find((teil) => typeof teil === "string");
    return typeof treffer === "string" ? treffer : undefined;
  }
  return undefined;
}

/** Terpen-Namen aus der URL: nur Buchstaben, Ziffern, Leerzeichen, Punkt, Bindestrich; höchstens 8. */
const terpListe = z
  .unknown()
  .transform((rohwert) => {
    const teile = (Array.isArray(rohwert) ? rohwert : [rohwert])
      .filter((teil): teil is string => typeof teil === "string")
      .flatMap((teil) => teil.split(","))
      .map((teil) => teil.trim())
      .filter((teil) => /^[\p{L}0-9 .-]{2,40}$/u.test(teil));
    return [...new Set(teile)].slice(0, 8);
  })
  .catch([] as string[]);

const schalter = z
  .unknown()
  .transform((rohwert) => {
    const wert = ersterWert(rohwert)?.toLowerCase();
    return wert === "1" || wert === "true" || wert === "ja";
  })
  .catch(false);

const zahl = (min: number, max: number, fallback: number) =>
  z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().finite().min(min).max(max))
    .catch(fallback);

const ganzzahl = (min: number, fallback: number) =>
  z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().int().min(min))
    .catch(fallback);

/**
 * Filterschema fuer die Katalogliste.
 *
 * Begruendung fuer die durchgaengige Nutzung von `.catch(...)`:
 * Die Suchparameter kommen direkt aus der URL und sind damit vollstaendig
 * nutzerkontrolliert. Eine manipulierte oder veraltete URL (Bot, alter Link,
 * Tippfehler) darf die Seite NIE in einen Fehler laufen lassen - sie faellt
 * still auf den Default zurueck. `parseStrainFilter` wirft deshalb nicht.
 */
export const strainFilterSchema = z.object({
  q: z
    .unknown()
    .transform((rohwert) => (ersterWert(rohwert) ?? "").trim().slice(0, 100))
    .transform((wert) => (wert.length > 0 ? wert : undefined))
    .catch(undefined),
  typ: enumListe(KULTIVAR_TYPEN),
  form: enumListe(DARREICHUNGSFORMEN),
  geschmack: enumListe(GESCHMACKS_KATEGORIEN),
  thcMin: zahl(0, 100, THC_MIN_DEFAULT),
  thcMax: zahl(0, 100, THC_MAX_DEFAULT),
  preisMax: z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().int().min(0))
    .optional()
    .catch(undefined),
  nurVerfuegbar: schalter,
  /** Mindestnote der Community, nur Stufen aus NOTEN_STUFEN. */
  note: z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().refine((n) => (NOTEN_STUFEN as readonly number[]).includes(n)))
    .optional()
    .catch(undefined),
  bewertet: schalter,
  terp: terpListe,
  cbd: schalter,
  apotheke: slugListe,
  /** Unternehmen-Ids der Vertreiber (Spec 2026-10-13); alte Links mit `hersteller` liest parseStrainFilter mit. */
  vertreiber: slugListe,
  /** Kultivar-Id (Spec 2026-10-13 Vertreiber sichtbar 2.1): alle Handelsnamen einer Blüte. */
  kultivar: z
    .unknown()
    .transform((rohwert) => (ersterWert(rohwert) ?? "").trim().toLowerCase())
    .transform((wert) => (/^[0-9a-f-]{32,36}$/.test(wert) ? wert : undefined))
    .catch(undefined),
  /**
   * Ansicht der Liste: je Blüte (Standard seit Spec Sorte im Fokus, 3) oder je Handelsname. Kein
   * Filter. Ohne Angabe gilt `standardAnsicht`: mit gewählter Blüte die Handelsnamen, sonst die Sorten.
   */
  ansicht: z
    .unknown()
    .transform((rohwert): "ware" | "bluete" | undefined => {
      const wert = ersterWert(rohwert);
      return wert === "bluete" || wert === "ware" ? wert : undefined;
    })
    .catch(undefined),
  sortierung: z
    .unknown()
    .transform((rohwert) => ersterWert(rohwert))
    .pipe(z.enum(SORTIERUNGEN))
    .catch("community"),
  /** Richtung der Sortierung (Spec 2026-10-21, 4). Ohne Angabe gilt `standardRichtung`. */
  richtung: z
    .unknown()
    .transform((rohwert): Richtung | undefined => {
      const wert = ersterWert(rohwert);
      return wert === "auf" || wert === "ab" ? wert : undefined;
    })
    .catch(undefined),
  seite: ganzzahl(1, 1),
});

export type StrainFilter = Omit<z.infer<typeof strainFilterSchema>, "ansicht"> & { ansicht: "ware" | "bluete" };

/** Ansicht ohne Angabe in der URL: eine gewählte Blüte zeigt ihre Handelsnamen, sonst je Sorte ein Eintrag. */
export function standardAnsicht(filter: Pick<StrainFilter, "kultivar">): "ware" | "bluete" {
  return filter.kultivar ? "ware" : "bluete";
}

const LEERER_FILTER: StrainFilter = {
  q: undefined,
  typ: [],
  form: [],
  geschmack: [],
  thcMin: THC_MIN_DEFAULT,
  thcMax: THC_MAX_DEFAULT,
  preisMax: undefined,
  nurVerfuegbar: false,
  apotheke: [],
  vertreiber: [],
  kultivar: undefined,
  note: undefined,
  bewertet: false,
  terp: [],
  cbd: false,
  ansicht: "bluete",
  sortierung: "community",
  richtung: undefined,
  seite: 1,
};

type SuchParameter =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function alsRecord(
  searchParams: SuchParameter
): Record<string, string | string[] | undefined> {
  if (searchParams instanceof URLSearchParams) {
    const record: Record<string, string | string[]> = {};
    for (const schluessel of new Set(searchParams.keys())) {
      const werte = searchParams.getAll(schluessel);
      record[schluessel] = werte.length > 1 ? werte : werte[0];
    }
    return record;
  }
  return searchParams;
}

/** Liest den Filterzustand aus den Suchparametern. Wirft nie. */
export function parseStrainFilter(searchParams: SuchParameter): StrainFilter {
  const roh = { ...alsRecord(searchParams) };
  // Alte Links (bis 2026-10-13): ?hersteller= meinte schon den Vertreiber, die Ids sind dieselben.
  if (roh.hersteller !== undefined && roh.vertreiber === undefined) roh.vertreiber = roh.hersteller;
  const ergebnis = strainFilterSchema.safeParse(roh);
  if (!ergebnis.success) {
    // Sollte durch die `.catch`-Kette nicht vorkommen - doppelte Absicherung.
    return { ...LEERER_FILTER };
  }
  const filter: StrainFilter = { ...ergebnis.data, ansicht: ergebnis.data.ansicht ?? standardAnsicht(ergebnis.data) };
  // Verdrehte Spanne (?thcMin=30&thcMax=10) still korrigieren statt fehlschlagen.
  if (filter.thcMin > filter.thcMax) {
    return { ...filter, thcMin: filter.thcMax, thcMax: filter.thcMin };
  }
  return filter;
}

/**
 * Gegenstueck zu `parseStrainFilter`: baut die URL wieder auf und laesst
 * alle Defaults weg, damit die URL kurz und teilbar bleibt.
 */
export function serialisiereFilter(filter: StrainFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.typ.length > 0) params.set("typ", filter.typ.join(","));
  if (filter.form.length > 0) params.set("form", filter.form.join(","));
  if (filter.geschmack.length > 0)
    params.set("geschmack", filter.geschmack.join(","));
  if (filter.thcMin !== THC_MIN_DEFAULT)
    params.set("thcMin", String(filter.thcMin));
  if (filter.thcMax !== THC_MAX_DEFAULT)
    params.set("thcMax", String(filter.thcMax));
  if (filter.preisMax !== undefined)
    params.set("preisMax", String(filter.preisMax));
  if (filter.nurVerfuegbar) params.set("nurVerfuegbar", "1");
  if (filter.apotheke.length > 0)
    params.set("apotheke", filter.apotheke.join(","));
  if (filter.vertreiber.length > 0)
    params.set("vertreiber", filter.vertreiber.join(","));
  if (filter.note !== undefined) params.set("note", String(filter.note));
  if (filter.bewertet) params.set("bewertet", "1");
  if (filter.terp.length > 0) params.set("terp", filter.terp.join(","));
  if (filter.cbd) params.set("cbd", "1");
  if (filter.kultivar) params.set("kultivar", filter.kultivar);
  if (filter.ansicht !== standardAnsicht(filter)) params.set("ansicht", filter.ansicht);
  if (filter.sortierung !== "community")
    params.set("sortierung", filter.sortierung);
  if (filter.richtung && filter.richtung !== standardRichtung(filter.sortierung))
    params.set("richtung", filter.richtung);
  if (filter.seite > 1) params.set("seite", String(filter.seite));
  return params;
}

/**
 * True, wenn kein einziges Kriterium gesetzt ist. Die Seitenzahl zaehlt
 * bewusst nicht als Filter - Basis fuer Empty-State und "Filter zuruecksetzen".
 */
export function istFilterLeer(filter: StrainFilter): boolean {
  return (
    !filter.q &&
    filter.typ.length === 0 &&
    filter.form.length === 0 &&
    filter.geschmack.length === 0 &&
    filter.thcMin === THC_MIN_DEFAULT &&
    filter.thcMax === THC_MAX_DEFAULT &&
    filter.preisMax === undefined &&
    !filter.nurVerfuegbar &&
    filter.apotheke.length === 0 &&
    filter.vertreiber.length === 0 &&
    filter.note === undefined &&
    !filter.bewertet &&
    filter.terp.length === 0 &&
    !filter.cbd &&
    !filter.kultivar
  );
}

/** Ein frischer, leerer Filter - fuer den Zuruecksetzen-Button. */
export function leererFilter(): StrainFilter {
  return { ...LEERER_FILTER };
}
