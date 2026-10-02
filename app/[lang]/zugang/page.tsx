import type { Metadata } from "next";
import Link from "next/link";

import { textLinkKlassen } from "@/components/ui/textlink";
import { ZugangFelder } from "@/components/zugang/ZugangFelder";
import { holeWoerterbuch } from "@/lib/i18n";
import { RECHTLICHE_LINKS } from "@/lib/rechtliches";

/**
 * Statisch je Sprache, ohne Ablauf (Spec 2026-10-01, statische Seiten, 4.3):
 * Der Text kommt nur aus dem Wörterbuch, `weiter` und `fehler` liest
 * ZugangFelder im Browser.
 */
export const dynamic = "force-static";
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.zugang.titel, robots: { index: false, follow: false } };
}

export default async function ZugangPage() {
  const w = await holeWoerterbuch();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-100 rounded-lg border border-border bg-surface p-8 shadow-md">
        <h1 className="text-h2 text-text">{w.zugang.ueberschrift}</h1>
        <p className="mt-2 text-small text-text-muted">
          {w.zugang.satz}
        </p>

        <form action="/api/zugang" method="post" className="mt-8 flex flex-col gap-4">
          <ZugangFelder texte={w.zugang} />

          <button
            type="submit"
            className="h-11 rounded-md bg-accent px-6 text-small font-medium text-accent-fg transition-opacity duration-150 ease-standard hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {w.zugang.weiter}
          </button>
        </form>

        {/* Impressum und Datenschutz sind vom Gate ausgenommen (proxy.ts). */}
        <nav aria-label={w.fuss.rechtliches} className="mt-8">
          <ul className="flex flex-wrap gap-x-6">
            {RECHTLICHE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className={textLinkKlassen("inline-flex min-h-11 items-center text-caption")}>
                  {w.fuss[link.schluessel]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
