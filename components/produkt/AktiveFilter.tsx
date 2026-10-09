import Link from "next/link";

import { formatierePreisProGramm, formatiereProzent } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";
import { istFilterLeer, leererFilter, serialisiereFilter } from "@/lib/query/filter";
import type { StrainFilter } from "@/lib/query/filter";

type Props = {
  filter: StrainFilter;
  /** Nur zur Anzeige der Apothekennamen — Slug allein waere nicht lesbar. */
  apothekenNamen?: ReadonlyMap<string, string>;
  /** Id zu Name der Hersteller (Spec 2026-10-09 C). */
  herstellerNamen?: ReadonlyMap<string, string>;
  w: Woerterbuch;
  sprache: Sprache;
};

type Chip = {
  schluessel: string;
  /** Klartext im Chip, ohne Feldnamen. */
  text: string;
  /** Beschreibt, welcher Filter entfernt wird (fuer aria-label). */
  beschreibung: string;
  /** Filter, der nach dem Entfernen dieses Wertes gilt. */
  ziel: StrainFilter;
};

const STANDARD = leererFilter();

/**
 * Aktive Filter als entfernbare Chips. Server Component: jeder Chip ist ein
 * normaler Link auf die Query ohne diesen Wert — funktioniert ohne JavaScript.
 */
export function AktiveFilter({ filter, apothekenNamen, herstellerNamen, w, sprache }: Props) {
  if (istFilterLeer(filter)) return null;
  const texte = w.katalog.aktiv;

  const chips: Chip[] = [];
  // Ein entfernter Wert fuehrt immer auf Seite 1 zurueck, sonst zeigt die
  // Paginierung ins Leere.
  const ohne = (teil: Partial<StrainFilter>): StrainFilter => ({
    ...filter,
    ...teil,
    seite: 1,
  });

  if (filter.q) {
    chips.push({
      schluessel: "q",
      text: t(texte.suche, { wert: filter.q }),
      beschreibung: t(texte.sucheBeschreibung, { wert: filter.q }),
      ziel: ohne({ q: undefined }),
    });
  }

  for (const typ of filter.typ) {
    chips.push({
      schluessel: `typ-${typ}`,
      text: w.label.kultivarTyp[typ],
      beschreibung: w.label.kultivarTyp[typ],
      ziel: ohne({ typ: filter.typ.filter((wert) => wert !== typ) }),
    });
  }

  for (const form of filter.form) {
    chips.push({
      schluessel: `form-${form}`,
      text: w.label.darreichungsform[form],
      beschreibung: w.label.darreichungsform[form],
      ziel: ohne({ form: filter.form.filter((wert) => wert !== form) }),
    });
  }

  for (const geschmack of filter.geschmack) {
    chips.push({
      schluessel: `geschmack-${geschmack}`,
      text: t(texte.geschmack, { wert: w.label.geschmack[geschmack] }),
      beschreibung: t(texte.geschmackBeschreibung, { wert: w.label.geschmack[geschmack] }),
      ziel: ohne({ geschmack: filter.geschmack.filter((wert) => wert !== geschmack) }),
    });
  }

  if (filter.thcMin !== STANDARD.thcMin || filter.thcMax !== STANDARD.thcMax) {
    const text = t(texte.thc, { von: formatiereProzent(filter.thcMin, 1, sprache), bis: formatiereProzent(filter.thcMax, 1, sprache) });
    chips.push({
      schluessel: "thc",
      text,
      beschreibung: text,
      ziel: ohne({ thcMin: STANDARD.thcMin, thcMax: STANDARD.thcMax }),
    });
  }

  if (filter.preisMax !== undefined) {
    const text = t(texte.bisPreis, { preis: formatierePreisProGramm(filter.preisMax, sprache) });
    chips.push({
      schluessel: "preisMax",
      text,
      beschreibung: t(texte.hoechstpreis, { text }),
      ziel: ohne({ preisMax: undefined }),
    });
  }

  if (filter.nurVerfuegbar) {
    chips.push({
      schluessel: "nurVerfuegbar",
      text: w.katalog.leiste.nurVerfuegbar,
      beschreibung: w.katalog.leiste.nurVerfuegbar,
      ziel: ohne({ nurVerfuegbar: false }),
    });
  }

  for (const slug of filter.apotheke) {
    const name = apothekenNamen?.get(slug) ?? slug;
    chips.push({
      schluessel: `apotheke-${slug}`,
      text: t(texte.apotheke, { wert: name }),
      beschreibung: t(texte.apothekeBeschreibung, { wert: name }),
      ziel: ohne({ apotheke: filter.apotheke.filter((wert) => wert !== slug) }),
    });
  }

  for (const id of filter.hersteller) {
    const name = herstellerNamen?.get(id) ?? id;
    chips.push({
      schluessel: `hersteller-${id}`,
      text: t(texte.hersteller, { wert: name }),
      beschreibung: t(texte.herstellerBeschreibung, { wert: name }),
      ziel: ohne({ hersteller: filter.hersteller.filter((wert) => wert !== id) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-caption tracking-wide text-text-muted">{texte.titel}</h2>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.schluessel}>
            <Link prefetch={false}
              href={`/blueten?${serialisiereFilter(chip.ziel).toString()}`}
              aria-label={t(texte.entfernen, { wert: chip.beschreibung })}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border-strong bg-surface-raised px-4 text-small text-text transition-opacity duration-150 ease-standard hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <span>{chip.text}</span>
              {/* Multiplikationszeichen als Form-Marker, nicht als Emoji. */}
              <span aria-hidden="true" className="text-text-muted">
                ×
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
