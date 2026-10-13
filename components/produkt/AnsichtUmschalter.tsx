import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { serialisiereFilter, type StrainFilter } from "@/lib/query/filter";

type Props = { filter: StrainFilter; texte: Woerterbuch["katalog"]["ansicht"] };

const ANSICHTEN = ["ware", "bluete"] as const;

/** Handelsnamen | Blüten (Spec 2.3): zwei Links, ohne JS; ein Wechsel führt auf Seite 1. */
export function AnsichtUmschalter({ filter, texte }: Props) {
  return (
    <nav aria-label={texte.titel}>
      <ul className="flex flex-wrap gap-2">
        {ANSICHTEN.map((ansicht) => {
          const aktiv = filter.ansicht === ansicht;
          const ziel = serialisiereFilter({ ...filter, ansicht, seite: 1 }).toString();
          return (
            <li key={ansicht}>
              <Link
                prefetch={false}
                href={ziel ? `/blueten?${ziel}` : "/blueten"}
                aria-current={aktiv ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  aktiv ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-raised text-text hover:border-accent-hover",
                )}
              >
                {ansicht === "ware" ? texte.ware : texte.bluete}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
