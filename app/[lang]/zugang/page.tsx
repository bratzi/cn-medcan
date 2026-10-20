import type { Metadata } from "next";
import Link from "next/link";

import { Auftakt } from "@/components/story/Auftakt";
import { textLinkKlassen } from "@/components/ui/textlink";
import { ZugangFelder } from "@/components/zugang/ZugangFelder";
import { ZugangLoops } from "@/components/zugang/ZugangLoops";
import { holeWoerterbuch } from "@/lib/i18n";
import { RECHTLICHE_LINKS } from "@/lib/rechtliches";
import { sprachParameter } from "@/lib/i18n/vorrendern";

/**
 * Statisch je Sprache, ohne Ablauf (Spec 2026-10-01, statische Seiten, 4.3):
 * Der Text kommt nur aus dem Wörterbuch, `weiter` und `fehler` liest
 * ZugangFelder im Browser.
 */
export const dynamic = "force-static";
export const revalidate = false;

/** Beide Sprachen im Build vorrendern, wenn die lokale D1 den Live-Abzug trägt (scripts/cf-build.mjs). */
export function generateStaticParams() {
  return sprachParameter();
}

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.zugang.titel, robots: { index: false, follow: false } };
}

export default async function ZugangPage() {
  const w = await holeWoerterbuch();

  // Nutzer 2026-10-20: die Kennwortseite ist die Startseite aller Gäste, also
  // derselbe Hero wie auf "/", die Karte sitzt darunter statt der Zahlen.
  return (
    <div className="relative isolate bg-surface">
      <ZugangLoops />
      <Auftakt
        zugang={
          <div className="w-full max-w-100 border border-border bg-surface/80 p-8 shadow-md backdrop-blur-sm">
            <p aria-hidden="true" className="text-center font-hand text-notiz leading-none text-logo">
              {w.zugang.notiz}
            </p>
            <h2 className="mt-4 text-center font-sans text-caption uppercase tracking-gesperrt text-text">
              {w.zugang.ueberschrift}
            </h2>
            <p className="mt-2 text-center text-small text-pretty text-text-muted">{w.zugang.satz}</p>

            <form action="/api/zugang" method="post" className="mt-8 flex flex-col gap-4">
              <ZugangFelder texte={w.zugang} />

              <button
                type="submit"
                className="h-11 rounded-full bg-accent px-6 text-small font-medium text-accent-fg transition-colors duration-fast ease-standard hover:bg-accent-hover"
              >
                {w.zugang.weiter}
              </button>
            </form>

            {/* Impressum und Datenschutz sind vom Gate ausgenommen (proxy.ts). */}
            <nav aria-label={w.fuss.rechtliches} className="mt-4">
              <ul className="flex flex-wrap justify-center gap-x-6">
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
        }
      />
    </div>
  );
}
