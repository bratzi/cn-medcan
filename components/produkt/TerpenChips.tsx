import { cn } from "@/lib/cn";
import { formatiereProzent, type Dezimalwert } from "@/lib/format";
import { geschmacksKategorieLabel } from "@/lib/labels";
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
  className?: string;
};

/**
 * Terpenprofil als Chips. Das dominante Terpen (Rang 1) ist durch Gewicht,
 * staerkeren Rahmen und den Zusatz "dominant" markiert — nicht durch Farbe.
 */
export function TerpenChips({ terpene, className }: TerpenChipsProps) {
  if (terpene.length === 0) {
    return (
      <p className={cn("text-small text-text-muted", className)}>
        Kein Terpenprofil hinterlegt.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {terpene.map((terpen) => {
        const dominant = terpen.rang === 1;
        const geschmack = terpen.geschmack
          ? geschmacksKategorieLabel[terpen.geschmack]
          : undefined;

        return (
          <li
            key={terpen.name}
            className={cn(
              "inline-flex items-baseline gap-2 rounded-sm border px-2 py-1 text-small",
              dominant
                ? "border-accent border-2 bg-accent-subtle font-medium text-text"
                : "border-border bg-surface-raised text-text",
            )}
          >
            {/* Handelsnamen und Terpennamen stehen unveraendert. */}
            <span title={terpen.name}>{terpen.name}</span>

            {geschmack ? (
              <span className="text-caption text-text-muted">{geschmack}</span>
            ) : null}

            {terpen.konzentrationProzent !== null &&
            terpen.konzentrationProzent !== undefined ? (
              <span className="numeric text-caption text-text-muted">
                {formatiereProzent(terpen.konzentrationProzent, 2)}
              </span>
            ) : null}

            {dominant ? (
              <span className="text-caption tracking-wide text-text-muted">dominant</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
