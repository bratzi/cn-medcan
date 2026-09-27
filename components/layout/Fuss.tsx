import Link from "next/link";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { MEDIEN, type MedienArt } from "@/lib/medien";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";
import { RECHTLICHE_LINKS } from "@/lib/rechtliches";
import type { Woerterbuch } from "@/lib/i18n/typen";

const LINKS = [...HAUPTNAVIGATION, KONTO_LINK];

// Wie im Kopf: Kapitel mit Handschrift-Nummer und Stiftstrich (globals.css).
const KAPITEL =
  "kapitel-link group inline-flex min-h-11 items-baseline gap-3 font-buch text-h2 font-medium text-text " +
  "transition-colors duration-fast ease-standard";

/**
 * Fuß auf allen Seiten (Spec 5.1, Sektion 9; Spec TP3 8.9). Die
 * Schlusszeile steht doppelt im selben Rasterfeld: unten als Kontur
 * (aria-hidden), darüber gefüllt. Auf der Startseite blendet die
 * StoryBuehne die gefüllten Wörter scroll-gekoppelt ein und schreibt die
 * Wortmarke; ohne Bewegung steht beides einfach da.
 */
export function Fuss({ w }: { w: Woerterbuch }) {
  const artLabel: Record<MedienArt, string> = { foto: w.fuss.foto, video: w.fuss.video };

  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-surface-raised">
      <div className="mx-auto w-full max-w-360 px-4 pt-16 sm:px-8 sm:pt-24">
        {/* Vorgelesen wird nur die sr-only-Fassung: die sichtbaren Ebenen teilt
            die StoryBuehne in Wörter, und ein aria-label auf einem span lesen
            Screenreader nicht zuverlässig vor. */}
        <p data-story="schluss" className="schlusszeile font-buch text-titel font-medium text-text">
          <span className="sr-only">{w.fuss.schlusszeile}</span>
          <span aria-hidden="true" className="schlusszeile-kontur">
            {w.fuss.schlusszeile}
          </span>
          <span aria-hidden="true" className="schlusszeile-fuellung">
            {w.fuss.schlusszeile}
          </span>
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-4 pt-16 pb-24 sm:px-8 md:grid-cols-[1fr_1.4fr_1fr] md:items-start">
        <div className="flex flex-col items-start gap-6">
          <Unterzeile className="text-text-muted" />
          {/* Zurückhaltend in der normalen Schrift und klein (Nutzer 2026-09-26). */}
          <a href="#inhalt" className="inline-flex min-h-11 items-center text-small whitespace-nowrap text-text-muted transition-colors duration-fast hover:text-text">
            {w.fuss.zurueckNachOben}
          </a>
        </div>

        <nav aria-label={w.fuss.navigation}>
          <p className="mb-4 text-caption uppercase tracking-gesperrt text-text-muted">{w.fuss.inhalt}</p>
          <ol className="flex flex-col gap-1">
            {LINKS.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className={KAPITEL}>
                  <span aria-hidden="true" className="kapitel-nummer font-hand text-vermerk leading-none">
                    {index + 1}
                  </span>
                  <span className="kapitel-wort">{w.kopf.navigation[link.schluessel]}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col items-start gap-6">
          <p className="max-w-[40ch] border-l-2 border-border-strong pl-4 text-caption text-text-muted text-pretty">
            {w.fuss.hinweis}
          </p>
          {/* Bildnachweise nach oben in die Spalte (Nutzer 2026-09-26): keine eigene Zeile
              mehr unter dem Fuß, damit die Wortmarke dahinter im Fuß liegt. */}
          <details>
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-caption text-text-muted">
              {w.fuss.bildnachweise}
            </summary>
            <ul className="mt-2 flex flex-col gap-2 pb-2 text-caption text-text-muted">
              {MEDIEN.map((m) => (
                <li key={m.id}>
                  {`${artLabel[m.art]}: `}
                  <a href={m.quelle} rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                    {m.urheber}
                  </a>
                  {w.fuss.aufPexels}
                </li>
              ))}
            </ul>
          </details>
          {/* Pflichtlinks: ohne Passwort erreichbar (proxy.ts), klein wie die Bildnachweise. */}
          <nav aria-label={w.fuss.rechtliches}>
            <ul className="flex flex-wrap gap-x-6">
              {RECHTLICHE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center text-caption text-text-muted underline underline-offset-2 transition-colors duration-fast hover:text-text"
                  >
                    {w.fuss[link.schluessel]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Die Wortmarke liegt IM Fuß hinter dem Inhalt (Spec Redesign 10), nicht
          darunter: absolut am unteren Rand, angeschnitten, blass. Der Name steht
          im Kopf, hier ist er Bild. */}
      <span aria-hidden="true" data-story="fuss-marke" className="fuss-marke pointer-events-none absolute inset-x-0 bottom-0 -z-10 block select-none text-center text-plakat">
        <Wortmarke groesse="plakat" />
      </span>
    </footer>
  );
}
