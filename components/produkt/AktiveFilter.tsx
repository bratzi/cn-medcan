import Link from "next/link";

import { formatierePreisProGramm, formatiereProzent } from "@/lib/format";
import { darreichungsformLabel, geschmacksKategorieLabel, kultivarTypLabel } from "@/lib/labels";
import { istFilterLeer, leererFilter, serialisiereFilter } from "@/lib/query/filter";
import type { StrainFilter } from "@/lib/query/filter";

type Props = {
  filter: StrainFilter;
  /** Nur zur Anzeige der Apothekennamen — Slug allein waere nicht lesbar. */
  apothekenNamen?: ReadonlyMap<string, string>;
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
export function AktiveFilter({ filter, apothekenNamen }: Props) {
  if (istFilterLeer(filter)) return null;

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
      text: `Suche: ${filter.q}`,
      beschreibung: `Suche ${filter.q}`,
      ziel: ohne({ q: undefined }),
    });
  }

  for (const typ of filter.typ) {
    chips.push({
      schluessel: `typ-${typ}`,
      text: kultivarTypLabel[typ],
      beschreibung: kultivarTypLabel[typ],
      ziel: ohne({ typ: filter.typ.filter((wert) => wert !== typ) }),
    });
  }

  for (const form of filter.form) {
    chips.push({
      schluessel: `form-${form}`,
      text: darreichungsformLabel[form],
      beschreibung: darreichungsformLabel[form],
      ziel: ohne({ form: filter.form.filter((wert) => wert !== form) }),
    });
  }

  for (const geschmack of filter.geschmack) {
    chips.push({
      schluessel: `geschmack-${geschmack}`,
      text: `Geschmack: ${geschmacksKategorieLabel[geschmack]}`,
      beschreibung: `Geschmack ${geschmacksKategorieLabel[geschmack]}`,
      ziel: ohne({ geschmack: filter.geschmack.filter((wert) => wert !== geschmack) }),
    });
  }

  if (filter.thcMin !== STANDARD.thcMin || filter.thcMax !== STANDARD.thcMax) {
    const text = `THC ${formatiereProzent(filter.thcMin)} bis ${formatiereProzent(filter.thcMax)}`;
    chips.push({
      schluessel: "thc",
      text,
      beschreibung: text,
      ziel: ohne({ thcMin: STANDARD.thcMin, thcMax: STANDARD.thcMax }),
    });
  }

  if (filter.preisMax !== undefined) {
    const text = `bis ${formatierePreisProGramm(filter.preisMax)}`;
    chips.push({
      schluessel: "preisMax",
      text,
      beschreibung: `Höchstpreis ${text}`,
      ziel: ohne({ preisMax: undefined }),
    });
  }

  if (filter.nurVerfuegbar) {
    chips.push({
      schluessel: "nurVerfuegbar",
      text: "Nur verfügbare Produkte",
      beschreibung: "Nur verfügbare Produkte",
      ziel: ohne({ nurVerfuegbar: false }),
    });
  }

  for (const slug of filter.apotheke) {
    const name = apothekenNamen?.get(slug) ?? slug;
    chips.push({
      schluessel: `apotheke-${slug}`,
      text: `Apotheke: ${name}`,
      beschreibung: `Apotheke ${name}`,
      ziel: ohne({ apotheke: filter.apotheke.filter((wert) => wert !== slug) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-caption tracking-wide text-text-muted">Aktive Filter</h2>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.schluessel}>
            <Link
              href={`/produkte?${serialisiereFilter(chip.ziel).toString()}`}
              aria-label={`Filter ${chip.beschreibung} entfernen`}
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
