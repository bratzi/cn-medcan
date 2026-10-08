import { TerpenIcon } from "@/components/review/AromaIcon";
import { baueAnsicht } from "@/components/story/TerpenRegister";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { LINIEN_FARBE, VERLAUF } from "@/lib/aroma-farben";
import type { GeschmacksKategorie } from "@/db/enums";
import { ladeTerpenRegister } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { TerpenBandKopie } from "@/components/story/TerpenBandKopie";
import { TerpenBandKarte, type KartenTerpen } from "@/components/story/TerpenBandKarte";

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
 * Buchschrift, klein und gedämpft. Bandhöhe ab sm 192 px (Raster), mobil bleibt
 * das schmale Icon-Band (Marke 44 px, Name sr-only).
 *
 * Seit 2026-10-09: die Infos (Duft, drei Noten mit Balken, Sortenzahl) zeigt
 * eine Karte außerhalb des Bands (TerpenBandKarte), die Spalte des Eintrags war
 * zu schmal und das Band beschnitt sie.
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
  const karten: KartenTerpen[] = terpene.map((terpen) => ({
    anker: terpen.anker,
    name: terpen.name,
    icon: terpen.icon,
    farbe: leitFarbe(terpen.noten[0]?.geschmack),
    duft: terpen.duft,
    sortenText: terpen.sortenText,
    noten: terpen.noten.slice(0, 3).map(({ anker, geschmack, label, anteil }) => ({ anker, geschmack, label, anteil })),
  }));

  const liste = (
    <ul className="terpen-band-liste flex shrink-0 items-start gap-8 pr-8 sm:gap-12 sm:pr-12">
      {terpene.map((terpen) => (
        <li
          key={terpen.anker}
          data-terpen={terpen.anker}
          className="terpen-band-eintrag group/eintrag flex flex-col items-center gap-1 text-center transition-transform duration-normal ease-standard sm:w-40"
          style={{ "--terpen-farbe": leitFarbe(terpen.noten[0]?.geschmack) } as React.CSSProperties}
        >
          {/* Der Eintrag springt zu seiner Tafel im Register darunter (Nutzer 2026-10-09: mobil tat
              Antippen nichts). Der Link trägt den Fokus; sichtbarer Fokus öffnet die Karte. */}
          <a href={`#${terpen.anker}`} className="flex flex-col items-center gap-1">
          {/* Abstand von 4 px (gap-1): das 8-px-Raster ist für die Gruppierung zu grob, Marke
              und Name gehören eng zusammen. */}
          {/* Marke: Tönung und Ring in der Leitnotenfarbe, das Icon in derselben Farbe, mit
              dem Textton abgemischt, damit es auf hellem wie dunklem Grund mindestens 3:1
              erreicht (WCAG 1.4.11; Gelb und Minzgrün sonst zu hell auf Hell). */}
          <span data-terpen-marke className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--terpen-farbe)_14%,transparent)] text-[color-mix(in_oklab,var(--terpen-farbe)_50%,var(--color-text))] ring-1 ring-inset ring-[color-mix(in_oklab,var(--terpen-farbe)_32%,transparent)] transition-colors duration-fast ease-standard group-hover/eintrag:bg-[color-mix(in_oklab,var(--terpen-farbe)_24%,transparent)] group-hover/eintrag:ring-[color-mix(in_oklab,var(--terpen-farbe)_56%,transparent)] transition-transform group-hover/eintrag:scale-110 group-focus-within/eintrag:scale-110 sm:size-14">
            <TerpenIcon name={terpen.icon} className="size-6 sm:size-8" />
            <span className="sr-only">{terpen.name}</span>
          </span>
          {/* Ab sm: Name zentriert unter der Marke, höchstens zwei Zeilen (min-h-10 hält
              beide Zeilen frei, die Höhe eines Eintrags hängt nicht vom Namen ab). Die Infos
              (Duft, Noten, Sorten) zeigt seit 2026-10-09 die Karte TerpenBandKarte außerhalb
              des Bands. Mobil trägt der sr-only-Name die Information. */}
          <span aria-hidden="true" className="flex min-h-10 w-full items-start justify-center font-buch text-body font-normal leading-tight text-text-muted text-balance wrap-break-word transition-colors duration-fast ease-standard group-hover/eintrag:text-text max-sm:hidden">
            {/* line-clamp-2 erzwingt die Grenze von zwei Zeilen (Höhenbudget). */}
            <span className="line-clamp-2">{terpen.name}</span>
          </span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={texte.terpene} className="terpen-band feldbuch-raster relative z-20 flex items-center overflow-x-clip bg-surface py-4 sm:min-h-48 sm:py-8">
      <div className="terpen-band-spur flex">
        {liste}
        <TerpenBandKopie />
      </div>
      <TerpenBandKarte terpene={karten} hinweis={texte.karteHinweis} />
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
