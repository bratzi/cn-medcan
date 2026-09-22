import { z } from "zod";

import {
  Darreichungsform,
  GeschmacksKategorie,
  KultivarTyp,
} from "@/lib/generated/prisma/enums";

/** Treffer pro Seite in der Katalogliste. */
export const TREFFER_PRO_SEITE = 24;

export const SORTIERUNGEN = [
  "relevanz",
  "thc_absteigend",
  "thc_aufsteigend",
  "preis_aufsteigend",
  "name",
] as const;

export type Sortierung = (typeof SORTIERUNGEN)[number];

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
    return [...new Set(teile)];
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
  typ: enumListe(Object.values(KultivarTyp)),
  form: enumListe(Object.values(Darreichungsform)),
  geschmack: enumListe(Object.values(GeschmacksKategorie)),
  thcMin: zahl(0, 100, THC_MIN_DEFAULT),
  thcMax: zahl(0, 100, THC_MAX_DEFAULT),
  preisMax: z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().int().min(0))
    .optional()
    .catch(undefined),
  nurVerfuegbar: z
    .unknown()
    .transform((rohwert) => {
      const wert = ersterWert(rohwert)?.toLowerCase();
      return wert === "1" || wert === "true" || wert === "ja";
    })
    .catch(false),
  apotheke: slugListe,
  sortierung: z
    .unknown()
    .transform((rohwert) => ersterWert(rohwert))
    .pipe(z.enum(SORTIERUNGEN))
    .catch("relevanz"),
  seite: ganzzahl(1, 1),
});

export type StrainFilter = z.infer<typeof strainFilterSchema>;

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
  sortierung: "relevanz",
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
  const ergebnis = strainFilterSchema.safeParse(alsRecord(searchParams));
  if (!ergebnis.success) {
    // Sollte durch die `.catch`-Kette nicht vorkommen - doppelte Absicherung.
    return { ...LEERER_FILTER };
  }
  const filter = ergebnis.data;
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
  if (filter.sortierung !== "relevanz")
    params.set("sortierung", filter.sortierung);
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
    filter.apotheke.length === 0
  );
}

/** Ein frischer, leerer Filter - fuer den Zuruecksetzen-Button. */
export function leererFilter(): StrainFilter {
  return { ...LEERER_FILTER };
}
