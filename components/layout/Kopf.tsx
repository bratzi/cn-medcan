import Link from "next/link";

import { NavLink } from "@/components/layout/NavLink";
import { Wortmarke } from "@/components/marke/Wortmarke";
import { KontoZaehler } from "@/components/layout/KontoZaehler";
import { KopfZustand } from "@/components/layout/KopfZustand";
import { ThemaSchalter } from "@/components/layout/ThemaSchalter";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1). Seit 2026-09-25 ohne Kapitelnummern
 * (Nutzer). "Mein Konto" steht abgesetzt als Pille.
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
// Kapitel-Link: Nummer von Hand, Wort gedruckt, Unterstrich zieht sich beim
// Hover wie ein Stiftstrich im Farbverlauf ein (globals.css .kapitel-link).
const NAV_LINK =
  "kapitel-link group inline-flex h-11 items-center gap-2 px-3 font-sans text-[0.75rem] font-medium uppercase tracking-gesperrt whitespace-nowrap text-text " +
  "transition-colors duration-fast ease-standard";

const AKTIV = "underline decoration-text decoration-2 underline-offset-8";

/** Das Wort trägt den Stiftstrich; die Nummer ist Dekoration (aria-hidden). */
const AKTIV_WORT = "kapitel-wort";

export function Kopf() {
  return (
    <header data-kopf="" className="kopf fixed inset-x-0 top-0 z-40">
      <div className="mx-auto grid w-full max-w-360 grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8 lg:grid-cols-[auto_1fr_auto_auto]">
        {/* Hell/Dunkel oben links vor der Wortmarke (Nutzer 2026-09-25, zuvor fest unten rechts). */}
        <div className="flex items-center gap-2 justify-self-start">
          <ThemaSchalter />
          <Link href="/" className="inline-flex min-h-11 items-center px-2">
            <Wortmarke groesse="kopf" />
          </Link>
        </div>

        <nav
          aria-label="Hauptnavigation"
          className="col-span-3 row-start-2 -mx-4 min-w-0 sm:-mx-8 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:justify-self-end"
        >
          <ul className="-my-2 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-2 sm:scroll-px-8 sm:px-8 lg:-mx-2 lg:px-2">
            {HAUPTNAVIGATION.map((eintrag) => (
              <li key={eintrag.href} className="shrink-0 snap-start">
                <NavLink href={eintrag.href} className={NAV_LINK} aktivKlasse="">
                  <span className={AKTIV_WORT}>{eintrag.text}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <NavLink
          href={KONTO_LINK.href}
          className="konto-pille col-start-3 row-start-1 inline-flex h-11 items-center rounded-full px-5 font-sans text-[0.75rem] font-medium uppercase tracking-gesperrt text-text lg:col-start-4"
          aktivKlasse={AKTIV}
        >
          {KONTO_LINK.text}
          <KontoZaehler />
        </NavLink>
      </div>
      <KopfZustand />
    </header>
  );
}
