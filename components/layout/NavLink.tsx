"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { istAktiv } from "@/lib/navigation";
import { ohneSprachPraefix } from "@/lib/proxy-regeln";

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
  // Der Server rendert unter dem internen Pfad (/de/reviews), der Browser kennt
  // den sichtbaren (/reviews): ohne Präfix vergleichen, sonst weicht das
  // Hydrieren ab (Spec 2026-10-01, statische Seiten, 4.2).
  const aktiv = istAktiv(ohneSprachPraefix(usePathname() ?? ""), href);
  return (
    <Link href={href} prefetch={false} aria-current={aktiv ? "page" : undefined} className={cn(className, aktiv && aktivKlasse)}>
      {children}
    </Link>
  );
}
