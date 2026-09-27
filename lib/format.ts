/**
 * Formatierung fuer de-DE und en-GB ohne externe Library.
 *
 * Alle `Intl`-Formatter werden einmal je Isolat gebaut: auf Cloudflare Workers
 * zaehlt CPU-Zeit (Free-Tier: 10 ms pro Request), und das Erzeugen eines
 * Formatters ist deutlich teurer als ein `format()`-Aufruf. Deutsch sofort,
 * Englisch erst beim ersten Gebrauch.
 *
 * Die festen Woerter ("k. A.", "Werktage", "Preis auf Anfrage") stehen hier
 * und nicht im Woerterbuch: diese Datei laden auch Client Components, und das
 * Woerterbuch soll nicht ins Browser-Paket (Plan Englisch, Abweichung 3).
 */
import type { Sprache } from "@/lib/i18n/sprache-kern";

/** Prisma liefert `Decimal`, nicht `number` — deshalb bewusst weit gefasst. */
export type Dezimalwert = number | string | { toString(): string };

const SCHMALES_LEERZEICHEN = " "; // NBSP: Einheit haengt am Wert
const GEDANKENSTRICH = "–"; // en dash fuer Bereiche

type Woerter = {
  /** Abstand zwischen Zahl und Prozentzeichen: de mit NBSP, en ohne. */
  prozentAbstand: string;
  keineAngabe: string;
  preisAufAnfrage: string;
  werktag: string;
  werktage: string;
};

type Formate = Woerter & {
  zahl: readonly Intl.NumberFormat[];
  euro: Intl.NumberFormat;
  gramm: Intl.NumberFormat;
  datum: Intl.DateTimeFormat;
  relativ: Intl.RelativeTimeFormat;
};

function baue(locale: string, woerter: Woerter): Formate {
  return {
    zahl: [0, 1, 2, 3].map(
      (stellen) =>
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: stellen,
          maximumFractionDigits: stellen,
        }),
    ),
    euro: new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }),
    gramm: new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "gram",
      unitDisplay: "short",
      maximumFractionDigits: 2,
    }),
    datum: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
    relativ: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    ...woerter,
  };
}

const DE = baue("de-DE", {
  prozentAbstand: SCHMALES_LEERZEICHEN,
  keineAngabe: "k. A.",
  preisAufAnfrage: "Preis auf Anfrage",
  werktag: "Werktag",
  werktage: "Werktage",
});
let EN: Formate | undefined;

function formate(sprache: Sprache): Formate {
  if (sprache === "de") return DE;
  EN ??= baue("en-GB", {
    prozentAbstand: "",
    keineAngabe: "n/a",
    preisAufAnfrage: "Price on request",
    werktag: "working day",
    werktage: "working days",
  });
  return EN;
}

/** Robuste Konvertierung: `Decimal`, String und `number` landen alle bei `number`. */
function zuZahl(wert: Dezimalwert | null | undefined): number | null {
  if (wert === null || wert === undefined) return null;
  const zahl = typeof wert === "number" ? wert : Number(wert.toString());
  return Number.isFinite(zahl) ? zahl : null;
}

function formatter(f: Formate, stellen: number): Intl.NumberFormat {
  return f.zahl[stellen] ?? f.zahl[1];
}

/** `22,0 %` bzw. `22.0%`. */
export function formatiereProzent(
  wert: Dezimalwert | null | undefined,
  stellen = 1,
  sprache: Sprache = "de",
): string {
  const f = formate(sprache);
  const zahl = zuZahl(wert);
  if (zahl === null) return f.keineAngabe;
  return `${formatter(f, stellen).format(zahl)}${f.prozentAbstand}%`;
}

/** `22,0 – 28,0 %`; bei gleichem Min und Max nur ein Wert. */
export function formatiereProzentSpanne(
  min: Dezimalwert | null | undefined,
  max: Dezimalwert | null | undefined,
  stellen = 1,
  sprache: Sprache = "de",
): string {
  const f = formate(sprache);
  const minZahl = zuZahl(min);
  const maxZahl = zuZahl(max);

  if (minZahl === null && maxZahl === null) return f.keineAngabe;
  if (minZahl === null) return formatiereProzent(maxZahl, stellen, sprache);
  if (maxZahl === null) return formatiereProzent(minZahl, stellen, sprache);
  if (minZahl === maxZahl) return formatiereProzent(minZahl, stellen, sprache);

  const z = formatter(f, stellen);
  return `${z.format(minZahl)}${SCHMALES_LEERZEICHEN}${GEDANKENSTRICH}${SCHMALES_LEERZEICHEN}${z.format(maxZahl)}${f.prozentAbstand}%`;
}

/** `12,50 €/g`; ohne Preis `Preis auf Anfrage`. */
export function formatierePreisProGramm(cent: number | null | undefined, sprache: Sprache = "de"): string {
  const f = formate(sprache);
  if (cent === null || cent === undefined || !Number.isFinite(cent)) {
    return f.preisAufAnfrage;
  }
  return `${f.euro.format(cent / 100)}/g`;
}

/** `10 g` */
export function formatiereGramm(wert: Dezimalwert | null | undefined, sprache: Sprache = "de"): string {
  const f = formate(sprache);
  const zahl = zuZahl(wert);
  if (zahl === null) return f.keineAngabe;
  return f.gramm.format(zahl);
}

function zuDatum(datum: Date | string | number): Date | null {
  const d = datum instanceof Date ? datum : new Date(datum);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `22.09.2026` bzw. `22/09/2026` */
export function formatiereDatum(
  datum: Date | string | number | null | undefined,
  sprache: Sprache = "de",
): string {
  const f = formate(sprache);
  if (datum === null || datum === undefined) return f.keineAngabe;
  const d = zuDatum(datum);
  return d ? f.datum.format(d) : f.keineAngabe;
}

const MINUTE = 60_000;
const STUNDE = 60 * MINUTE;
const TAG = 24 * STUNDE;

/** `vor 3 Tagen` — relativ zu `jetzt` (Default: aktuelle Zeit). */
export function formatiereRelativ(
  datum: Date | string | number | null | undefined,
  jetzt: Date | number = Date.now(),
  sprache: Sprache = "de",
): string {
  const f = formate(sprache);
  if (datum === null || datum === undefined) return f.keineAngabe;
  const d = zuDatum(datum);
  if (!d) return f.keineAngabe;

  const basis = typeof jetzt === "number" ? jetzt : jetzt.getTime();
  const diff = d.getTime() - basis;
  const absolut = Math.abs(diff);

  if (absolut < MINUTE) return f.relativ.format(0, "second");
  if (absolut < STUNDE) {
    return f.relativ.format(Math.round(diff / MINUTE), "minute");
  }
  if (absolut < TAG) {
    return f.relativ.format(Math.round(diff / STUNDE), "hour");
  }
  if (absolut < 30 * TAG) {
    return f.relativ.format(Math.round(diff / TAG), "day");
  }
  if (absolut < 365 * TAG) {
    return f.relativ.format(Math.round(diff / (30 * TAG)), "month");
  }
  return f.relativ.format(Math.round(diff / (365 * TAG)), "year");
}

/** `1 – 2 Werktage`, `2 Werktage`, `1 Werktag`. */
export function formatiereLieferzeit(
  min: number | null | undefined,
  max: number | null | undefined,
  sprache: Sprache = "de",
): string {
  const f = formate(sprache);
  const minZahl = min ?? max;
  const maxZahl = max ?? min;
  if (
    minZahl === null ||
    minZahl === undefined ||
    maxZahl === null ||
    maxZahl === undefined
  ) {
    return f.keineAngabe;
  }

  const ganz = f.zahl[0];
  if (minZahl === maxZahl) {
    const einheit = minZahl === 1 ? f.werktag : f.werktage;
    return `${ganz.format(minZahl)} ${einheit}`;
  }

  return `${ganz.format(minZahl)}${SCHMALES_LEERZEICHEN}${GEDANKENSTRICH}${SCHMALES_LEERZEICHEN}${ganz.format(maxZahl)} ${f.werktage}`;
}
