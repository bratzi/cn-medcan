/**
 * Feines Spaltenraster und blasse Randnotizen hinter der Startseite
 * (Spec 4.7). Trägt keine Information, deshalb vollständig aria-hidden.
 * Die Notizen stehen in Cormorant kursiv wie Bleistift im Feldbuch, nicht
 * in Sedgwick: sie sind die Stimme des Buchs, nicht der Wand.
 */
const RANDNOTIZEN = [
  { text: "Ch. 24-117", links: "6%", oben: "14%", drehung: "-rotate-3" },
  { text: "RF 11 %", links: "82%", oben: "31%", drehung: "rotate-2" },
  { text: "Trichome dicht", links: "4%", oben: "47%", drehung: "-rotate-2" },
  { text: "Glas geöffnet 9:40", links: "74%", oben: "63%", drehung: "rotate-3" },
  { text: "Ch. 25-032", links: "10%", oben: "81%", drehung: "-rotate-1" },
] as const;

export function FeldbuchRaster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="feldbuch-raster fixed inset-0" />
      {RANDNOTIZEN.map((notiz) => (
        <span
          key={notiz.text}
          className={`absolute hidden font-buch text-h3 font-light italic text-text-muted opacity-40 lg:block ${notiz.drehung}`}
          style={{ left: notiz.links, top: notiz.oben }}
        >
          {notiz.text}
        </span>
      ))}
    </div>
  );
}
