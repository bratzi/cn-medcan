import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { baueAnsicht } from "@/components/story/TerpenRegister";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { farbFlaeche } from "@/lib/aroma-farben";
import { ladeTerpenRegister } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { TerpenBandKopie } from "@/components/story/TerpenBandKopie";

/**
 * Band zwischen Hero und Story (Nutzer 2026-09-30): die Terpene des Katalogs
 * laufen waagrecht durch. Seit 2026-10-03 steht neben jedem Icon im Band selbst,
 * was das Terpen riecht und welche Geschmacksnoten es trägt, mit Farbbalken wie
 * im Register; im Ruhezustand gedämpft, beim Überfahren voll lesbar. Der alte
 * Tooltip ist weg, er erschien nie (Befund E0: der Zeiger landete auf der
 * stummen Kopie). Hover hält das Band an. Der Server rendert die Liste nur einmal
 * (CPU-Limit, Fehler 1102); die zweite Kopie für den nahtlosen Lauf klont
 * TerpenBandKopie im Browser, ohne Tooltips und für Screenreader und Tastatur
 * stumm.
 * Bewegung allein per CSS (globals.css, .terpen-band); bei reduzierter
 * Bewegung und im Sparmodus stehen die Icons umbrochen.
 * Optik wie eine Randleiste im Buch: 24-px-Icons gedämpft in text-muted, erst
 * bei Hover in text. Bandhöhe ab sm 192 px (h-48, Raster), mobil weiter 78 px
 * (py-4, 44 px Fläche, Haarlinien); das Skelett trägt dieselben Maße, damit beim
 * Laden nichts springt.
 */
async function Inhalt() {
  const [katalog, w, sprache] = await Promise.all([
    sicher(() => ladeTerpenRegister(), [], "Terpen-Band der Startseite"),
    holeWoerterbuch(),
    holeSprache(),
  ]);
  if (katalog.length === 0) return null;
  const { terpene } = baueAnsicht(katalog, w, sprache);
  const texte = w.start.register;

  const liste = (
    <ul className="terpen-band-liste flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
      {terpene.map((terpen) => (
        <li key={terpen.anker} className="group flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition-colors duration-fast ease-standard group-hover:text-text">
            <TerpenIcon name={terpen.icon} className="size-6" />
            <span className="sr-only">{terpen.name}</span>
          </span>
          {/* Die Infos stehen seit 2026-10-03 im Band statt in einer Tafel (Nutzer): der
              Tooltip erschien nie, weil der Zeiger auf der stummen Kopie landete (Befund
              E0). Im Ruhezustand gedämpft, beim Überfahren voll lesbar. Mobil bleibt das
              schmale Icon-Band, dort trägt der sr-only-Name die Information. */}
          <span aria-hidden="true" className="grid w-64 gap-1 max-sm:hidden">
            <span className="flex items-baseline gap-2">
              <span className="font-buch text-body font-medium leading-tight text-text-muted transition-colors duration-fast ease-standard group-hover:text-text">
                {terpen.name}
              </span>
              <span className="text-caption text-text-muted">{terpen.sortenText}</span>
            </span>
            {terpen.duft ? (
              <span className="block truncate text-caption text-text-muted transition-colors duration-fast ease-standard group-hover:text-text">
                {terpen.duft}
              </span>
            ) : null}
            <span className="mt-1 grid gap-1">
              {/* Drei Noten: mehr sprengt die Bandhöhe, die wegen des Skeletts fest ist. */}
              {terpen.noten.slice(0, 3).map((note) => (
                <span key={note.anker} className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-caption text-text-muted transition-colors duration-fast ease-standard group-hover:text-text">
                    <GeschmackIcon geschmack={note.geschmack} className="size-4 shrink-0" />
                    <span className="truncate">{note.label}</span>
                  </span>
                  <span
                    className="block h-1.5 rounded-full opacity-60 transition-opacity duration-fast ease-standard group-hover:opacity-100"
                    style={{ width: `${Math.round(Math.min(1, Math.max(0, note.anteil)) * 100)}%`, background: farbFlaeche(note.geschmack) }}
                  />
                </span>
              ))}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={texte.terpene} className="terpen-band relative z-20 flex items-center overflow-x-clip border-y border-border bg-surface py-4 sm:h-48 sm:py-0">
      <div className="terpen-band-spur flex">
        {liste}
        <TerpenBandKopie />
      </div>
    </section>
  );
}

/**
 * Ohne Suspense (Befund 2026-10-05, live): auf der statischen Startseite wurde die erste
 * Suspense-Grenze nie enthüllt. Ihr Inhalt stand als `<div hidden id="S:0">` im HTML, aber
 * das zugehörige `$RC("B:0","S:0")` fehlte, während die Grenzen S:1 bis S:6 ihr Reveal
 * bekamen. Sichtbar blieb deshalb dauerhaft das Skelett. Die Seite ist statisch
 * (`revalidate = 300`), also darf das Band beim Vorrendern blockieren: dann steht es fest im
 * HTML und hängt an keinem Reveal.
 */
export function TerpenBand() {
  return <Inhalt />;
}
