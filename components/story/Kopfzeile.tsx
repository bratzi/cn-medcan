/**
 * Kopfzeile wie bei einer Zeitung. Steht unten in der ersten Ansicht (Auftakt),
 * damit sie ohne Scrollen sichtbar ist, als Band über die volle Breite, im
 * Nebentext-Stil der Unterzeile (Versalien, gesperrt; Nutzer 2026-09-25).
 * Mitte seit 2026-09-25 "since 2026" statt des Stands (Nutzer); damit fällt
 * auch die Datenbankabfrage dafür weg. Seit 2026-09-26 auf 80 % der Breite
 * zentriert, Linien und Texte (Nutzer).
 */
export function Kopfzeile() {
  return (
    <div className="mx-auto grid w-4/5 grid-cols-1 gap-2 border-y border-border-strong py-2 font-sans text-caption uppercase tracking-gesperrt text-text-muted sm:grid-cols-3 sm:items-center">
      <span>Book of Terpz</span>
      <span className="tabular-nums sm:text-center">since 2026</span>
      <span className="sm:text-right">Terpz 4 Nerdz</span>
    </div>
  );
}
