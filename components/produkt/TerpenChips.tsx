import { cn } from "@/lib/cn";
import { formatiereProzent, type Dezimalwert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import type { GeschmacksKategorie } from "@/db/enums";

export type TerpenEintrag = {
  name: string;
  geschmack?: GeschmacksKategorie | null;
  konzentrationProzent?: Dezimalwert | null;
  /** 1 = dominantes Terpen. */
  rang?: number | null;
};

export type TerpenChipsProps = {
  terpene: readonly TerpenEintrag[];
  w: Woerterbuch;
  sprache: Sprache;
  className?: string;
};

/**
 * Terpenprofil als Chips. Das dominante Terpen (Rang 1) ist durch Gewicht,
 * staerkeren Rahmen und den Zusatz "dominant" markiert, nicht durch Farbe.
 */
export function TerpenChips({ terpene, w, sprache, className }: TerpenChipsProps) {
  if (terpene.length === 0) {
    return (
      <p className={cn("text-small text-text-muted", className)}>
        {w.katalog.karte.keinTerpenprofil}
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {terpene.map((terpen) => {
        const dominant = terpen.rang === 1;
        const geschmack = terpen.geschmack
          ? w.label.geschmack[terpen.geschmack]
          : undefined;

        return (
          <li
            key={terpen.name}
            className={cn(
              // py-1 = 4px: Textzeile in einer Pille, wie beim Badge.
              "inline-flex items-baseline gap-2 rounded-full border bg-surface-raised px-4 py-1 text-small text-text",
              dominant ? "border-2 border-text font-medium" : "border-border-strong",
            )}
          >
            {/* Handelsnamen und Terpennamen stehen unveraendert. */}
            <span title={terpen.name}>{terpenAnzeige(terpen.name, sprache)}</span>

            {geschmack ? (
              <span className="text-caption text-text-muted">{geschmack}</span>
            ) : null}

            {terpen.konzentrationProzent !== null &&
            terpen.konzentrationProzent !== undefined ? (
              <span className="numeric text-caption text-text-muted">
                {formatiereProzent(terpen.konzentrationProzent, 2, sprache)}
              </span>
            ) : null}

            {dominant ? (
              <span className="text-caption tracking-wide text-text-muted">{w.katalog.karte.dominant}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
