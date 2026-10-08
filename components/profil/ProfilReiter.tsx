import Link from "next/link";

import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  aktiv: "profil" | "konto";
  texte: Woerterbuch["profil"];
  /** Ungelesene Benachrichtigungen: sie stehen im Reiter Konto, die Zahl am Kopfknopf führt aber hierher. */
  ungelesen?: { anzahl: number; text: string };
};

const REITER = [
  { id: "profil", href: "/profil" },
  { id: "konto", href: "/mitglied" },
] as const;

/**
 * Reiter Profil | Konto (Spec Profil 5, 6): kein fünfter Menüpunkt, das Konto
 * ist ein Reiter des Profils. Aktiv mit aria-current und Unterstrich, nie nur Farbe.
 * Seit Spec Profil und Konto 5 groß im Kapitelkopf, Unterstrich in Blattgrün.
 */
export function ProfilReiter({ aktiv, texte, ungelesen }: Props) {
  return (
    <nav aria-label={texte.reiterLeiste} className="flex flex-wrap gap-x-8 gap-y-2">
      {REITER.map((r) => (
        <Link
          key={r.id}
          prefetch={false}
          href={r.href}
          aria-current={aktiv === r.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 text-h2 transition-colors duration-fast ease-standard hover:text-text",
            // cn mischt nicht (ohne tailwind-merge): die Textfarbe steht je Zustand genau einmal.
            aktiv === r.id
              ? "text-text underline decoration-accent decoration-2 underline-offset-8"
              : "text-text-muted",
          )}
        >
          {r.id === "profil" ? texte.reiterProfil : texte.reiterKonto}
          {r.id === "konto" && ungelesen && ungelesen.anzahl > 0 ? (
            <Badge variante="accent" zeichen={false}>
              <span aria-hidden="true" className="numeric">{ungelesen.anzahl}</span>
              <span className="sr-only">{ungelesen.text}</span>
            </Badge>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
