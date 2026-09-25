import Link from "next/link";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { MEDIEN, type MedienArt } from "@/lib/medien";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

const LINKS = [...HAUPTNAVIGATION, KONTO_LINK];

const ART_LABEL: Record<MedienArt, string> = { foto: "Foto", video: "Video" };

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
export function Fuss() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-surface-raised">
      <div className="mx-auto w-full max-w-360 px-4 pt-16 sm:px-8 sm:pt-24">
        {/* Vorgelesen wird nur die sr-only-Fassung: die sichtbaren Ebenen teilt
            die StoryBuehne in Wörter, und ein aria-label auf einem span lesen
            Screenreader nicht zuverlässig vor. */}
        <p data-story="schluss" className="schlusszeile font-buch text-titel font-medium text-text">
          <span className="sr-only">Wir lesen mit. Wir wählen mit.</span>
          <span aria-hidden="true" className="schlusszeile-kontur">
            Wir lesen mit. Wir wählen mit.
          </span>
          <span aria-hidden="true" className="schlusszeile-fuellung">
            Wir lesen mit. Wir wählen mit.
          </span>
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-4 pt-16 pb-24 sm:px-8 md:grid-cols-[1fr_1.4fr_1fr] md:items-start">
        <div className="flex flex-col items-start gap-6">
          <Unterzeile className="text-text-muted" />
          <a href="#inhalt" className="farbverlauf font-hand text-notiz transition-opacity duration-fast hover:opacity-80">
            Zurück zum Anfang ↑
          </a>
        </div>

        <nav aria-label="Fußnavigation">
          <p className="mb-4 text-caption uppercase tracking-gesperrt text-text-muted">Inhalt</p>
          <ol className="flex flex-col gap-1">
            {LINKS.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href} className={KAPITEL}>
                  <span aria-hidden="true" className="kapitel-nummer font-hand text-vermerk leading-none">
                    {index + 1}
                  </span>
                  <span className="kapitel-wort">{link.text}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <p className="max-w-[40ch] border-l-2 border-border-strong pl-4 text-caption text-text-muted text-pretty">
          Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
          Information und ersetzen keine medizinische oder pharmazeutische Beratung. Eine Abgabe
          von Arzneimitteln erfolgt über diese Seite nicht.
        </p>
      </div>

      <div className="mx-auto w-full max-w-360 border-t border-border px-4 py-6 sm:px-8">
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-caption text-text-muted">
            Bildnachweise
          </summary>
          <ul className="mt-2 flex flex-col gap-2 pb-2 text-caption text-text-muted">
            {MEDIEN.map((m) => (
              <li key={m.id}>
                {`${ART_LABEL[m.art]}: `}
                <a href={m.quelle} rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                  {m.urheber}
                </a>
                {" auf Pexels"}
              </li>
            ))}
          </ul>
        </details>
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
