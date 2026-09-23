import Link from "next/link";

import { Wortmarke } from "@/components/marke/Wortmarke";

/**
 * Nummerierte Hauptnavigation (Spec 4.3, Wizard Trees). Die Nummern sind
 * Dekoration und aria-hidden; Kapitelköpfe der Startseite bleiben ohne
 * Nummern (Spec 5.1).
 *
 * Bewusst ein fester Link "Mein Konto" statt "Anmelden"/"Mein Konto" je nach
 * Sitzung: das Layout müsste dafür die Sitzung lesen und wäre auf jeder
 * Seite dynamisch. /mitglied leitet ohne Anmeldung selbst auf /anmelden weiter.
 */
const NAVIGATION = [
  { href: "/produkte", text: "Produkte" },
  { href: "/apotheken", text: "Apotheken" },
  { href: "/mitglied", text: "Mein Konto" },
] as const;

const NAV_LINK =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-small font-medium text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken";

export function Kopf() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center px-2">
          <Wortmarke groesse="kopf" />
        </Link>

        <nav aria-label="Hauptnavigation">
          <ul className="flex flex-wrap items-center gap-2">
            {NAVIGATION.map((eintrag, index) => (
              <li key={eintrag.href}>
                <Link href={eintrag.href} className={NAV_LINK}>
                  <span aria-hidden="true" className="numeric text-caption text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {eintrag.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
