/**
 * Feines Spaltenraster hinter der Startseite (Spec 4.7). Trägt keine
 * Information, deshalb aria-hidden. Die Randnotizen in Handschrift sind mit
 * dem Redesign (Spec 7) den Schlagwörtern hinter den Sektionen gewichen.
 */
export function FeldbuchRaster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="feldbuch-raster fixed inset-0" />
    </div>
  );
}
