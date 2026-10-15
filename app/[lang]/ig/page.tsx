import type { Metadata } from "next";
import Link from "next/link";

import { seitenRahmen } from "@/components/layout/Seitenkopf";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/**
 * Landingpage aus der Instagram-Bio (Spec 2026-10-15). Vom Passwort-Gate
 * ausgenommen (lib/proxy-regeln.ts), die drei Ziele dahinter nicht: wer ohne
 * Passwort klickt, landet auf /zugang. Statisch, nur Deutsch wie das Impressum.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Book of Terpz auf Instagram",
  description:
    "Unabhängige Sortenbewertung für Medizinalcannabis – ehrlich, nach festem Schema, mit einer Community, die Sorten gemeinsam voranbringt.",
  robots: { index: true, follow: true },
};

type Weg = {
  href: string;
  titel: string;
  nutzen: string;
  /** Säulenfarbe als linke Kante: Token, wo es einen gibt, sonst der Wert aus der Spec. */
  kante: string;
  haupt?: boolean;
};

// Hick: genau drei Wege. Die Hauptaktion steht zuletzt und fällt als einzige gefüllte Fläche auf.
const WEGE: Weg[] = [
  {
    href: "/reviews",
    titel: "So bewerten wir",
    nutzen: "Fünf Noten, Restfeuchte und Aroma, für jede Sorte nach demselben Schema.",
    kante: "border-l-logo",
  },
  {
    href: "/umfragen",
    titel: "Mitmachen",
    nutzen: "Freiwillige Events: gemeinsam Sorten vorschlagen, nach vorn bringen und zusammen bewerten.",
    kante: "border-l-violett-400",
  },
  {
    href: "/registrieren",
    titel: "Mitglied werden",
    nutzen: "Mitlesen, mitbewerten und bei Events mitmachen, wann du willst.",
    kante: "border-l-[#c98a3e]",
    haupt: true,
  },
];

export default function IgPage() {
  return (
    <div lang="de" className={cn(seitenRahmen(true), "pt-16 pb-24 sm:pt-24")}>
      <header className="text-center">
        <p aria-hidden="true" className="font-hand text-notiz text-logo">
          Book of Terpz
        </p>
        <h1 className="mt-4 font-buch text-h1 font-medium text-balance text-text">
          Unabhängige Sortenbewertung für Medizinalcannabis
        </h1>
        <p className="mt-4 text-body text-pretty text-text-muted">
          Ehrlich, nach festem Schema, mit einer Community, die Sorten gemeinsam voranbringt.
        </p>
      </header>

      <nav aria-label="Wege ins Portal" className="mt-12">
        <ul className="flex flex-col gap-4">
          {WEGE.map((weg) => (
            <li key={weg.href}>
              <Link
                href={weg.href}
                prefetch={false}
                className={cn(
                  "flex min-h-12 flex-col gap-1 border border-l-4 px-6 py-4 transition-colors duration-fast ease-standard",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  weg.haupt
                    ? "border-transparent bg-accent text-accent-fg hover:bg-accent-hover"
                    : "border-border bg-surface-raised text-text hover:bg-surface-sunken",
                  // Zuletzt, sonst überschreibt die Rahmenfarbe die Säulenkante.
                  weg.kante,
                )}
              >
                <h2 className="font-buch text-h3 font-medium">{weg.titel}</h2>
                <span className={cn("text-body text-pretty", weg.haupt ? "text-accent-fg" : "text-text-muted")}>
                  {weg.nutzen}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-12 text-small text-pretty text-text-muted">
        Unsere Inhalte beschreiben nur Aroma, Aussehen und Qualität. Keine Beratung, keine Werbung für
        Arzneimittel. Mehr im{" "}
        <Link href="/impressum" prefetch={false} className={textLinkKlassen()}>
          Impressum
        </Link>
        .
      </p>
    </div>
  );
}
