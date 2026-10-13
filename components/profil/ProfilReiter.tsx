import Link from "next/link";

import type { ProfilAnsicht } from "@/lib/profil-ansicht";

type Props = { basis: string; aktiv: ProfilAnsicht; reiter: readonly { ansicht: ProfilAnsicht; text: string }[]; beschriftung: string };

/** Reiter als Links (Spec Profil Desktop): ohne JavaScript bedienbar, der Server rendert nur den gewählten. */
export function ProfilReiter({ basis, aktiv, reiter, beschriftung }: Props) {
  return (
    <nav aria-label={beschriftung} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-2 border-b border-border">
        {reiter.map((r) => {
          const href = r.ansicht === "uebersicht" ? basis : `${basis}?ansicht=${r.ansicht}`;
          const ist = r.ansicht === aktiv;
          return (
            <li key={r.ansicht}>
              <Link
                prefetch={false}
                href={href}
                scroll={false}
                aria-current={ist ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-4 text-small font-medium transition-colors duration-fast ${
                  ist ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {r.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
