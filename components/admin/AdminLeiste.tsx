"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_BEREICHE, type AdminZaehler } from "@/lib/admin-aufgaben";

const LINK = "inline-flex min-h-11 items-center gap-2 px-3 text-body text-text-muted aria-[current=page]:border-b-2 aria-[current=page]:border-accent aria-[current=page]:text-text";

/** Bereichsleiste der Verwaltung: scrollt in sich auf schmalen Schirmen, nie die Seite. */
export function AdminLeiste({ zaehler }: { zaehler: AdminZaehler }) {
  const pfad = usePathname();
  const aktiv = (href: string) => pfad.endsWith(href);
  return (
    <nav aria-label="Verwaltung" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 border-b border-border">
        <li>
          <Link prefetch={false} href="/admin" aria-current={pfad.endsWith("/admin") ? "page" : undefined} className={LINK}>
            Übersicht
          </Link>
        </li>
        {ADMIN_BEREICHE.map((b) => {
          const zahl = b.zaehlt ? zaehler[b.id] : undefined;
          return (
            <li key={b.id}>
              <Link prefetch={false} href={b.href} aria-current={aktiv(b.href) ? "page" : undefined} className={LINK}>
                {b.titel}
                {zahl ? <span className="numeric rounded-full border border-warning bg-surface-raised px-2 text-small text-text">{zahl}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
