import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";

export type EmpfehlungsEintrag = { slug: string; handelsname: string; begruendung: string };

/**
 * Liste empfohlener Sorten (T11, Nutzer 2026-09-29): Handelsname gedruckt als
 * Link, darunter die Begründung nach Aroma. Eckige Zellen mit Linie oben statt
 * Karten; eine, zwei oder drei Spalten je nach Breite. Nur Aroma (HWG).
 */
export function EmpfehlungsListe({
  eintraege,
  schmal = false,
  className,
}: {
  eintraege: readonly EmpfehlungsEintrag[];
  /** In schmalen Spalten (/mitglied) höchstens zwei Spalten. */
  schmal?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2", !schmal && "lg:grid-cols-3", className)}>
      {eintraege.map((e) => (
        <li key={e.slug} className="flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href={`/blueten/${e.slug}`}
            className={namenLinkKlassen("inline-flex min-h-11 items-center font-buch text-h3 wrap-break-word")}
          >
            {e.handelsname}
          </Link>
          {e.begruendung ? <p className="text-small text-text-muted text-pretty">{e.begruendung}</p> : null}
        </li>
      ))}
    </ol>
  );
}
