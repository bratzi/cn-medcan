import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { baueAnsicht } from "@/components/story/TerpenRegister";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { LINIEN_FARBE, VERLAUF, farbFlaeche } from "@/lib/aroma-farben";
import type { GeschmacksKategorie } from "@/db/enums";
import { ladeTerpenRegister } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { TerpenBandKopie } from "@/components/story/TerpenBandKopie";

/**
 * Band zwischen Hero und Story (Nutzer 2026-09-30): die Terpene des Katalogs
 * laufen waagrecht durch, der Server rendert die Liste nur einmal (CPU-Limit,
 * Fehler 1102), die zweite Kopie für den nahtlosen Lauf klont TerpenBandKopie im
 * Browser, stumm für Screenreader und Tastatur. Bewegung allein per CSS
 * (globals.css, .terpen-band); bei reduzierter Bewegung und im Sparmodus stehen
 * die Einträge umbrochen.
 *
 * Stand 2026-10-07 (dritte Überarbeitung): eine ruhige Register-Leiste wie
 * Daumenregister in einem Kräuterbuch. Jedes Terpen ist eine runde Marke (56 px,
 * Icon 32 px) in der Farbe seiner Leitnote, darunter zentriert der Name in
 * Buchschrift, klein und gedämpft. Die Infos (Duft, drei Noten mit
 * Balken) erscheinen nur beim Eintrag unter dem Zeiger: Hover am Eintrag
 * (group/eintrag), nicht am Band. Nur dieser Eintrag rückt nach oben, damit
 * Marke, Name und Infos in die 192 px des Bands passen (globals.css). Bandhöhe
 * ab sm 192 px (Raster), mobil bleibt das schmale Icon-Band (Marke 44 px, Name
 * sr-only); das Skelett trägt dieselben Maße, damit beim Laden nichts springt.
 * Der Hover-Pfad bleibt ohne Lücke: die Infos hängen als Nachfahre am Eintrag
 * und halten :hover, während der Eintrag hochrückt.
 */

/**
 * Volltonfarbe der Leitnote fürs Icon: farbFlaeche liefert bei Fruchtig und
 * Blumig einen Verlauf, der als Textfarbe ungültig wäre; dann zählt die erste
 * Stufe des Verlaufs. Ohne Note: gedämpfte Textfarbe.
 */
function leitFarbe(geschmack: GeschmacksKategorie | undefined): string {
  if (!geschmack) return "var(--color-text-muted)";
  return LINIEN_FARBE[geschmack] ?? VERLAUF[geschmack]?.[0] ?? "var(--color-text-muted)";
}

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
    <ul className="terpen-band-liste flex shrink-0 items-start gap-8 pr-8 sm:gap-12 sm:pr-12">
      {terpene.map((terpen) => (
        <li
          key={terpen.anker}
          className="terpen-band-eintrag group/eintrag flex flex-col items-center gap-1 text-center transition-transform duration-normal ease-standard sm:w-40"
          style={{ "--terpen-farbe": leitFarbe(terpen.noten[0]?.geschmack) } as React.CSSProperties}
        >
          {/* Abstände von 4 px (gap-1 hier, am Namenblock und an den Noten): das 8-px-Raster ist
              für die Gruppierung zu grob, Marke, Name und Infos gehören eng zusammen und müssen
              samt Infos in 192 px passen (Budget in globals.css). */}
          {/* Marke: Tönung und Ring in der Leitnotenfarbe, das Icon in derselben Farbe, mit
              dem Textton abgemischt, damit es auf hellem wie dunklem Grund mindestens 3:1
              erreicht (WCAG 1.4.11; Gelb und Minzgrün sonst zu hell auf Hell). */}
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--terpen-farbe)_14%,transparent)] text-[color-mix(in_oklab,var(--terpen-farbe)_50%,var(--color-text))] ring-1 ring-inset ring-[color-mix(in_oklab,var(--terpen-farbe)_32%,transparent)] transition-colors duration-fast ease-standard group-hover/eintrag:bg-[color-mix(in_oklab,var(--terpen-farbe)_24%,transparent)] group-hover/eintrag:ring-[color-mix(in_oklab,var(--terpen-farbe)_56%,transparent)] sm:size-14">
            <TerpenIcon name={terpen.icon} className="size-6 sm:size-8" />
            <span className="sr-only">{terpen.name}</span>
          </span>
          {/* Ab sm: Name zentriert unter der Marke, höchstens zwei Zeilen (min-h-10 hält
              beide Zeilen frei, die Höhe eines Eintrags hängt nicht vom Namen ab). Die Infos
              blenden nur beim Eintrag unter dem Zeiger oder mit Fokus ein. Im Laufmodus
              (globals.css) hängen sie absolut unter dem Namen: Höhe und Breite (w-40) bleiben
              fix, sonst ruckt der Lauf und --band-kachel stimmt nicht. Im Fallback (umbrochen)
              stehen sie im Fluss. Mobil trägt der sr-only-Name die Information. */}
          <span aria-hidden="true" className="relative grid w-full gap-1 max-sm:hidden">
            <span className="flex min-h-10 items-start justify-center font-buch text-body font-normal leading-tight text-text-muted text-balance wrap-break-word transition-colors duration-fast ease-standard group-hover/eintrag:text-text">
              {/* line-clamp-2 erzwingt die Grenze von zwei Zeilen (Höhenbudget). */}
              <span className="line-clamp-2">{terpen.name}</span>
            </span>
            {/* minmax(0,1fr): ohne diese Spur weitet die Mindestbreite des Inhalts die Infos
                über die 160-px-Spalte ins Nachbarterpen (live bis 349 px, Nutzer 2026-10-07).
                Der Duft steht deshalb allein und gekürzt in seiner Zeile, der volle Satz im
                title; für die Sortenzahl daneben war nie Platz, eine eigene Zeile sprengt die
                Bandhöhe. */}
            <span className="terpen-band-info pointer-events-none grid grid-cols-[minmax(0,1fr)] gap-1 opacity-0 transition-opacity duration-normal ease-standard group-hover/eintrag:pointer-events-auto group-hover/eintrag:opacity-100 group-focus-within/eintrag:pointer-events-auto group-focus-within/eintrag:opacity-100">
              {terpen.duft ? (
                <span className="truncate text-caption text-text-muted" title={terpen.duft}>{terpen.duft}</span>
              ) : null}
              {/* Drei Noten: mehr sprengt die Bandhöhe, die wegen des Skeletts fest ist. */}
              <span className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {terpen.noten.slice(0, 3).map((note) => (
                  <span key={note.anker} className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] items-center gap-2 text-left">
                    <span className="inline-flex items-center gap-2 text-caption text-text-muted">
                      <GeschmackIcon geschmack={note.geschmack} className="size-4 shrink-0" />
                      <span className="truncate">{note.label}</span>
                    </span>
                    <span
                      className="block h-1.5 rounded-full opacity-60 transition-opacity duration-fast ease-standard group-hover/eintrag:opacity-100"
                      style={{ width: `${Math.round(Math.min(1, Math.max(0, note.anteil)) * 100)}%`, background: farbFlaeche(note.geschmack) }}
                    />
                  </span>
                ))}
              </span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={texte.terpene} className="terpen-band relative z-20 flex items-center overflow-x-clip border-y border-border bg-surface py-4 sm:min-h-48 sm:py-8">
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
