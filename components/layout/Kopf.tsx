import Link from "next/link";

import { NavLink } from "@/components/layout/NavLink";
import { Logo } from "@/components/marke/Logo";
import { KontoZaehler } from "@/components/layout/KontoZaehler";
import { KopfMenue } from "@/components/layout/KopfMenue";
import { KopfZustand } from "@/components/layout/KopfZustand";
import { SprachSchalter } from "@/components/layout/SprachSchalter";
import { ThemaSchalter } from "@/components/layout/ThemaSchalter";
import { I18N_OEFFENTLICH } from "@/lib/i18n/schalter";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
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
 * Bis lg (Nutzer 2026-09-27, vorher eine wischbare Leiste): eine Zeile mit
 * Menüknopf links, Logo mittig und Konto als Symbol rechts; Navigation, Zelt und Sprache
 * stehen im Aufklappmenü (KopfMenue). Einzeilig mit allen Punkten erst ab lg:
 * die Zeile braucht rund 940 px (Punkte, Wortmarke, Konto, Abstände).
 */
// Kapitel-Link: Nummer von Hand, Wort gedruckt, Unterstrich zieht sich beim
// Hover wie ein Stiftstrich im Farbverlauf ein (globals.css .kapitel-link).
const NAV_LINK =
  "kapitel-link group inline-flex h-11 items-center gap-2 px-3 font-sans text-[0.75rem] font-medium uppercase tracking-gesperrt whitespace-nowrap text-text " +
  "transition-colors duration-fast ease-standard";

const AKTIV = "underline decoration-text decoration-2 underline-offset-8";

/** Das Wort trägt den Stiftstrich; die Nummer ist Dekoration (aria-hidden). */
const AKTIV_WORT = "kapitel-wort";

// Platz fuer Zelt und Sprachschalter in der Fensterecke, nur ab lg (darunter stehen beide im Menü);
// breit erst, wenn der Rand neben max-w-360 die Schalter fasst (ab 1700 px).
const EINRUECKUNG = I18N_OEFFENTLICH
  ? "pl-2 sm:pl-6 lg:pl-40 min-[1700px]:pl-8"
  : "pl-2 sm:pl-6 lg:pl-20 min-[1640px]:pl-8";

/** Menüpunkt unter lg: gedruckt, groß, ganze Zeile als Trefferfläche. */
const MENUE_LINK =
  "flex min-h-14 items-center border-b border-border font-buch text-h2 text-text transition-colors duration-fast ease-standard hover:text-accent";

const MENUE_AKTIV = "text-accent underline decoration-2 underline-offset-8";

type Props = {
  sprache: Sprache;
  /** Vom Root-Layout gelesen; der Kopf selbst liest keine Anfrage. */
  w: Woerterbuch;
};

export function Kopf({ sprache, w }: Props) {
  return (
    <header data-kopf="" className="kopf fixed inset-x-0 top-0 z-40">
      {/* Hell/Dunkel fest in der linken oberen Fensterecke, außerhalb des Inhalts
          (Nutzer 2026-09-25); bis der Rand breit genug ist, rückt der Kopf dafür ein. */}
      <ThemaSchalter texte={w.kopf.thema} />
      <SprachSchalter aktuell={sprache} gruppe={w.sprache.gruppe} />
      <div className={`mx-auto grid w-full max-w-360 grid-cols-[1fr_auto_1fr] items-center gap-x-2 py-2 pr-2 sm:pr-6 lg:grid-cols-[auto_1fr_auto] lg:gap-x-4 lg:pr-8 ${EINRUECKUNG}`}>
        {/* Logo statt einzeiliger Wortmarke (Nutzer 2026-09-26): "Book of" klein oben,
            "Terpz" im Fokus, Konturen, Verlauf und Glanz wie im Auftakt. */}
        <Link href="/" className="col-start-2 row-start-1 inline-flex min-h-11 items-center justify-self-center px-2 py-1 lg:col-start-1 lg:justify-self-start">
          <Logo className="text-marke" />
        </Link>

        <nav
          aria-label={w.kopf.hauptnavigation}
          className="-mx-2 justify-self-end max-lg:hidden"
        >
          <ul className="flex gap-2">
            {HAUPTNAVIGATION.map((eintrag) => (
              <li key={eintrag.href}>
                <NavLink href={eintrag.href} className={NAV_LINK} aktivKlasse="">
                  <span className={AKTIV_WORT}>{w.kopf.navigation[eintrag.schluessel]}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <NavLink
          href={KONTO_LINK.href}
          className="konto-pille relative col-start-3 row-start-1 inline-flex size-11 justify-self-end items-center justify-center rounded-full font-sans text-[0.75rem] font-medium uppercase tracking-gesperrt text-text lg:w-auto lg:px-5"
          aktivKlasse={AKTIV}
        >
          <span className="max-lg:sr-only">{w.kopf.navigation[KONTO_LINK.schluessel]}</span>
          {/* Schmal nur das Symbol (Nutzer 2026-09-27): Kopf und Schultern. */}
          <svg aria-hidden="true" viewBox="0 0 24 24" className="konto-symbol lg:hidden">
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
          </svg>
          <KontoZaehler texte={w.kopf.ungelesen} sprache={sprache} />
        </NavLink>

        <KopfMenue texte={w.kopf.menue}>
          <nav aria-label={w.kopf.hauptnavigation}>
            <ul className="border-t border-border">
              {HAUPTNAVIGATION.map((eintrag) => (
                <li key={eintrag.href}>
                  <NavLink href={eintrag.href} className={MENUE_LINK} aktivKlasse={MENUE_AKTIV}>
                    {w.kopf.navigation[eintrag.schluessel]}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink href={KONTO_LINK.href} className={MENUE_LINK} aktivKlasse={MENUE_AKTIV}>
                  {w.kopf.navigation[KONTO_LINK.schluessel]}
                </NavLink>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-4 pt-8">
            <ThemaSchalter texte={w.kopf.thema} />
            <SprachSchalter aktuell={sprache} gruppe={w.sprache.gruppe} />
          </div>
        </KopfMenue>
      </div>
      <KopfZustand />
    </header>
  );
}
