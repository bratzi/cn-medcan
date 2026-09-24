import Link from "next/link";

import { NavLink } from "@/components/layout/NavLink";
import { ThemaSchalter } from "@/components/layout/ThemaSchalter";
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
 * Bis lg: erste Zeile Wortmarke und Konto, darunter die vier Punkte als
 * wischbare Leiste bis an den Rand; der nächste Punkt schaut an. Einzeilig
 * erst ab lg: die Zeile braucht rund 940 px (vier Punkte 548, Wortmarke,
 * Konto, Abstände), bei md liefe die Leiste über die Wortmarke.
 * Die Leiste scrollt seitlich; overflow-x schneidet dann auch senkrecht ab,
 * deshalb py-2 (mit -my-2 ausgeglichen) als Platz für den Fokusring.
 */
const NAV_LINK =
  "group inline-flex h-11 items-center gap-2 rounded-full px-4 text-small font-medium whitespace-nowrap text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken";

const AKTIV = "underline decoration-text decoration-2 underline-offset-8";

/** Aktiv-Markierung nur am Wort: die Nummer ist Dekoration (aria-hidden). */
const AKTIV_WORT =
  "group-aria-[current=page]:underline group-aria-[current=page]:decoration-text " +
  "group-aria-[current=page]:decoration-2 group-aria-[current=page]:underline-offset-8";

export function Kopf() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto grid w-full max-w-360 grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8 lg:grid-cols-[auto_1fr_auto_auto]">
        <Link href="/" className="inline-flex min-h-11 items-center justify-self-start px-2">
          <Wortmarke groesse="kopf" />
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="col-span-3 row-start-2 -mx-4 min-w-0 sm:-mx-8 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:justify-self-end"
        >
          <ul className="-my-2 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-2 sm:scroll-px-8 sm:px-8 lg:-mx-2 lg:px-2">
            {HAUPTNAVIGATION.map((eintrag, index) => (
              <li key={eintrag.href} className="shrink-0 snap-start">
                <NavLink href={eintrag.href} className={NAV_LINK} aktivKlasse="">
                  <span aria-hidden="true" className="numeric text-caption text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={AKTIV_WORT}>{eintrag.text}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <ThemaSchalter className={`${NAV_LINK} col-start-2 row-start-1 lg:col-start-3`} />

        <NavLink
          href={KONTO_LINK.href}
          className={buttonKlassen("secondary", "md", "col-start-3 row-start-1 lg:col-start-4")}
          aktivKlasse={AKTIV}
        >
          {KONTO_LINK.text}
        </NavLink>
      </div>
    </header>
  );
}
