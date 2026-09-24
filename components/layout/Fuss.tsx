import Link from "next/link";

import { Wortmarke } from "@/components/marke/Wortmarke";
import { MEDIEN, type MedienArt } from "@/lib/medien";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

const LINKS = [...HAUPTNAVIGATION, KONTO_LINK];

const ART_LABEL: Record<MedienArt, string> = { foto: "Foto", video: "Video" };

const TEXTLINK =
  "inline-flex min-h-11 items-center text-small text-accent underline underline-offset-4 " +
  "transition-colors duration-fast ease-standard hover:text-accent-hover";

/**
 * Fuß auf allen Seiten (Spec 5.1, Sektion 9; Spec TP3 8.9). Die
 * Schlusszeile steht doppelt im selben Rasterfeld: unten als Kontur
 * (aria-hidden), darüber gefüllt. Auf der Startseite blendet die
 * StoryBuehne die gefüllten Wörter scroll-gekoppelt ein und schreibt die
 * Wortmarke; ohne Bewegung steht beides einfach da.
 */
export function Fuss() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface-raised">
      <div className="mx-auto w-full max-w-360 px-4 pt-16 sm:px-8 sm:pt-24">
        {/* Vorgelesen wird nur die sr-only-Fassung: die sichtbaren Ebenen teilt
            die StoryBuehne in Wörter, und ein aria-label auf einem span lesen
            Screenreader nicht zuverlässig vor. */}
        <p data-story="schluss" className="schlusszeile font-buch text-titel font-medium text-text">
          <span className="sr-only">Du liest mit. Du wählst mit.</span>
          <span aria-hidden="true" className="schlusszeile-kontur">
            Du liest mit. Du wählst mit.
          </span>
          <span aria-hidden="true" className="schlusszeile-fuellung">
            Du liest mit. Du wählst mit.
          </span>
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-4 pb-16 sm:grid-cols-[2fr_1fr] sm:px-8">
        <p className="max-w-[68ch] text-caption text-text-muted">
          Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
          Information und ersetzen keine medizinische oder pharmazeutische Beratung. Eine Abgabe
          von Arzneimitteln erfolgt über diese Seite nicht.
        </p>

        <nav aria-label="Fußnavigation">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={TEXTLINK}>
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
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

      {/* Zuletzt im Fuß: nur so läuft die Wortmarke über den negativen
          Außenabstand unten aus dem Bild, statt Rechtshinweis und Navigation
          zu verdecken. Der Name steht im Kopf, hier ist er Bild. */}
      <span aria-hidden="true" data-story="fuss-marke" className="fuss-marke block select-none text-umschlag">
        <Wortmarke groesse="umschlag" einzeilig />
      </span>
    </footer>
  );
}
