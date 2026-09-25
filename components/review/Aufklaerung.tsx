/**
 * Sachliche Einordnung neben der Aroma-Karte (Spec Redesign 14). Bewusst
 * ohne Wirk- oder Heilversprechen zu einzelnen Terpenen oder Produkten
 * (§ 10 HWG, verschreibungspflichtige Arzneimittel): nur, woran die
 * Einteilung Sativa/Indica scheitert und worauf wir stattdessen schauen.
 */
export function Aufklaerung() {
  return (
    <aside className="mt-8 grid max-w-4xl grid-cols-1 gap-6 border-t border-border pt-8 md:grid-cols-2">
      <h3 className="font-buch text-h2 font-medium text-text text-balance">
        Sativa oder Indica? <em className="farbverlauf hand-betont">Sagt wenig.</em>
      </h3>
      <div className="flex flex-col gap-4 text-body text-text-muted text-pretty">
        <p>
          Die Einteilung stammt aus Botanik und Anbau: sie beschreibt, wie eine Pflanze wächst, nicht, was in der
          Blüte steckt. Nach Jahrzehnten der Kreuzung ist fast jede Sorte eine Mischung.
        </p>
        <p>
          Aussagekräftiger ist, was sich messen lässt: der Gehalt an Cannabinoiden wie THC und CBD und das
          Terpenprofil. Deshalb vergleichen wir hier Terpene und Geschmack, nicht die Art.
        </p>
      </div>
    </aside>
  );
}
