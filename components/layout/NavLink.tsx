"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { istAktiv } from "@/lib/navigation";

type Props = {
  href: string;
  className: string;
  /** Sichtbare Markierung zusaetzlich zu aria-current, nie nur Farbe. */
  aktivKlasse: string;
  children: ReactNode;
};

/**
 * Die einzige Client-Stelle im Kopf: nur der Browser kennt den Pfad. Der
 * Kopf selbst bleibt Server Component und liest keine Sitzung.
 */
export function NavLink({ href, className, aktivKlasse, children }: Props) {
  const aktiv = istAktiv(usePathname() ?? "", href);
  return (
    <Link href={href} prefetch={false} aria-current={aktiv ? "page" : undefined} className={cn(className, aktiv && aktivKlasse)}>
      {children}
    </Link>
  );
}
