/**
 * Feines Spaltenraster und blasse Randnotizen hinter der Startseite
 * (Spec 4.7). Trägt keine Information, deshalb vollständig aria-hidden.
 * Seit dem Redesign (Spec 1) stehen die Notizen in Handschrift, blass wie
 * Bleistift im Feldbuch: Messwerte, notiert beim Probieren. Ab lg, nie Inhalt.
 */
const RANDNOTIZEN = [
  { text: "Charge 24-117", links: "6%", oben: "12%" },
  { text: "Myrcen", links: "80%", oben: "24%" },
  { text: "Restfeuchte 11 %", links: "3%", oben: "38%" },
  { text: "Trichome dicht", links: "76%", oben: "52%" },
  { text: "Limonen", links: "8%", oben: "66%" },
  { text: "Glas auf, 9:40", links: "72%", oben: "79%" },
  { text: "Charge 25-032", links: "12%", oben: "90%" },
] as const;

export function FeldbuchRaster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="feldbuch-raster fixed inset-0" />
      {RANDNOTIZEN.map((notiz) => (
        <span
          key={notiz.text}
          className="absolute hidden font-hand text-notiz text-text-muted opacity-30 lg:block"
          style={{ left: notiz.links, top: notiz.oben }}
        >
          {notiz.text}
        </span>
      ))}
    </div>
  );
}
