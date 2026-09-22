/**
 * de-DE-Formatierung ohne externe Library.
 *
 * Alle `Intl`-Formatter sind Modul-Konstanten: auf Cloudflare Workers zaehlt
 * CPU-Zeit (Free-Tier: 10 ms pro Request), und das Erzeugen eines Formatters
 * ist deutlich teurer als ein `format()`-Aufruf.
 */

/** Prisma liefert `Decimal`, nicht `number` — deshalb bewusst weit gefasst. */
export type Dezimalwert = number | string | { toString(): string };

const SCHMALES_LEERZEICHEN = " "; // NBSP: Einheit haengt am Wert
const GEDANKENSTRICH = "–"; // en dash fuer Bereiche
const KEINE_ANGABE = "k. A.";

const ZAHL_FORMATTER: readonly Intl.NumberFormat[] = [0, 1, 2, 3].map(
  (stellen) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: stellen,
      maximumFractionDigits: stellen,
    }),
);

const GANZZAHL_FORMATTER = ZAHL_FORMATTER[0];

const EURO_FORMATTER = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const GRAMM_FORMATTER = new Intl.NumberFormat("de-DE", {
  style: "unit",
  unit: "gram",
  unitDisplay: "short",
  maximumFractionDigits: 2,
});

const DATUM_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const RELATIV_FORMATTER = new Intl.RelativeTimeFormat("de-DE", {
  numeric: "auto",
});

/** Robuste Konvertierung: `Decimal`, String und `number` landen alle bei `number`. */
function zuZahl(wert: Dezimalwert | null | undefined): number | null {
  if (wert === null || wert === undefined) return null;
  const zahl = typeof wert === "number" ? wert : Number(wert.toString());
  return Number.isFinite(zahl) ? zahl : null;
}

function formatter(stellen: number): Intl.NumberFormat {
  return ZAHL_FORMATTER[stellen] ?? ZAHL_FORMATTER[1];
}

/** `22,0 %` — Einheit mit schmalem Abstand. */
export function formatiereProzent(
  wert: Dezimalwert | null | undefined,
  stellen = 1,
): string {
  const zahl = zuZahl(wert);
  if (zahl === null) return KEINE_ANGABE;
  return `${formatter(stellen).format(zahl)}${SCHMALES_LEERZEICHEN}%`;
}

/** `22,0 – 28,0 %`; bei gleichem Min und Max nur ein Wert. */
export function formatiereProzentSpanne(
  min: Dezimalwert | null | undefined,
  max: Dezimalwert | null | undefined,
  stellen = 1,
): string {
  const minZahl = zuZahl(min);
  const maxZahl = zuZahl(max);

  if (minZahl === null && maxZahl === null) return KEINE_ANGABE;
  if (minZahl === null) return formatiereProzent(maxZahl, stellen);
  if (maxZahl === null) return formatiereProzent(minZahl, stellen);
  if (minZahl === maxZahl) return formatiereProzent(minZahl, stellen);

  const f = formatter(stellen);
  return `${f.format(minZahl)}${SCHMALES_LEERZEICHEN}${GEDANKENSTRICH}${SCHMALES_LEERZEICHEN}${f.format(maxZahl)}${SCHMALES_LEERZEICHEN}%`;
}

/** `12,50 €/g`; ohne Preis `Preis auf Anfrage`. */
export function formatierePreisProGramm(cent: number | null | undefined): string {
  if (cent === null || cent === undefined || !Number.isFinite(cent)) {
    return "Preis auf Anfrage";
  }
  return `${EURO_FORMATTER.format(cent / 100)}/g`;
}

/** `10 g` */
export function formatiereGramm(wert: Dezimalwert | null | undefined): string {
  const zahl = zuZahl(wert);
  if (zahl === null) return KEINE_ANGABE;
  return GRAMM_FORMATTER.format(zahl);
}

function zuDatum(datum: Date | string | number): Date | null {
  const d = datum instanceof Date ? datum : new Date(datum);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `22.09.2026` */
export function formatiereDatum(datum: Date | string | number | null | undefined): string {
  if (datum === null || datum === undefined) return KEINE_ANGABE;
  const d = zuDatum(datum);
  return d ? DATUM_FORMATTER.format(d) : KEINE_ANGABE;
}

const MINUTE = 60_000;
const STUNDE = 60 * MINUTE;
const TAG = 24 * STUNDE;

/** `vor 3 Tagen` — relativ zu `jetzt` (Default: aktuelle Zeit). */
export function formatiereRelativ(
  datum: Date | string | number | null | undefined,
  jetzt: Date | number = Date.now(),
): string {
  if (datum === null || datum === undefined) return KEINE_ANGABE;
  const d = zuDatum(datum);
  if (!d) return KEINE_ANGABE;

  const basis = typeof jetzt === "number" ? jetzt : jetzt.getTime();
  const diff = d.getTime() - basis;
  const absolut = Math.abs(diff);

  if (absolut < MINUTE) return RELATIV_FORMATTER.format(0, "second");
  if (absolut < STUNDE) {
    return RELATIV_FORMATTER.format(Math.round(diff / MINUTE), "minute");
  }
  if (absolut < TAG) {
    return RELATIV_FORMATTER.format(Math.round(diff / STUNDE), "hour");
  }
  if (absolut < 30 * TAG) {
    return RELATIV_FORMATTER.format(Math.round(diff / TAG), "day");
  }
  if (absolut < 365 * TAG) {
    return RELATIV_FORMATTER.format(Math.round(diff / (30 * TAG)), "month");
  }
  return RELATIV_FORMATTER.format(Math.round(diff / (365 * TAG)), "year");
}

/** `1 – 2 Werktage`, `2 Werktage`, `1 Werktag`. */
export function formatiereLieferzeit(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  const minZahl = min ?? max;
  const maxZahl = max ?? min;
  if (
    minZahl === null ||
    minZahl === undefined ||
    maxZahl === null ||
    maxZahl === undefined
  ) {
    return KEINE_ANGABE;
  }

  if (minZahl === maxZahl) {
    const einheit = minZahl === 1 ? "Werktag" : "Werktage";
    return `${GANZZAHL_FORMATTER.format(minZahl)} ${einheit}`;
  }

  return `${GANZZAHL_FORMATTER.format(minZahl)}${SCHMALES_LEERZEICHEN}${GEDANKENSTRICH}${SCHMALES_LEERZEICHEN}${GANZZAHL_FORMATTER.format(maxZahl)} Werktage`;
}
