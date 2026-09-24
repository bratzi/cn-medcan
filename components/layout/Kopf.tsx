import Link from "next/link";

import { NavLink } from "@/components/layout/NavLink";
import { Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui/Button";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1). Die Nummern sind Dekoration
 * und aria-hidden. "Mein Konto" steht abgesetzt als Pille ohne Nummer.
 * Die aktive Seite markiert NavLink: aria-current plus Unterstrich in Tinte.
 *
 * Bewusst ein fester Link "Mein Konto" statt "Anmelden"/"Mein Konto" je nach
 * Sitzung: das Layout müsste dafür die Sitzung lesen und wäre auf jeder
 * Seite dynamisch. /mitglied leitet ohne Anmeldung selbst auf /anmelden weiter.
 *
 * Handy: erste Zeile Wortmarke und Konto, darunter die vier Punkte als
 * wischbare Leiste bis an den Rand; der nächste Punkt schaut an.
 */
const NAV_LINK =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-small font-medium whitespace-nowrap text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken";

const AKTIV = "underline decoration-text decoration-2 underline-offset-8";

export function Kopf() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto grid w-full max-w-360 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="inline-flex min-h-11 items-center justify-self-start px-2">
          <Wortmarke groesse="kopf" />
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="col-span-2 row-start-2 -mx-4 min-w-0 sm:-mx-8 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-0 md:justify-self-end"
        >
          <ul className="flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 sm:scroll-px-8 sm:px-8 md:px-0">
            {HAUPTNAVIGATION.map((eintrag, index) => (
              <li key={eintrag.href} className="shrink-0 snap-start">
                <NavLink href={eintrag.href} className={NAV_LINK} aktivKlasse={AKTIV}>
                  <span aria-hidden="true" className="numeric text-caption text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {eintrag.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <NavLink
          href={KONTO_LINK.href}
          className={buttonKlassen("secondary", "md", "col-start-2 row-start-1 md:col-start-3")}
          aktivKlasse={AKTIV}
        >
          {KONTO_LINK.text}
        </NavLink>
      </div>
    </header>
  );
}
