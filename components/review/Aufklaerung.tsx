import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Sachliche Einordnung neben der Aroma-Karte (Spec Redesign 14). Bewusst
 * ohne Wirk- oder Heilversprechen zu einzelnen Terpenen oder Produkten
 * (§ 10 HWG, verschreibungspflichtige Arzneimittel): nur, woran die
 * Einteilung Sativa/Indica scheitert und worauf wir stattdessen schauen.
 */
export function Aufklaerung({ texte }: { texte: Woerterbuch["aroma"]["aufklaerung"] }) {
  return (
    <aside className="mt-8 grid max-w-4xl grid-cols-1 gap-6 border-t border-border pt-8 md:grid-cols-2">
      <h3 className="font-buch text-h2 font-medium text-text text-balance">
        {texte.frage} <em className="farbverlauf hand-betont">{texte.betont}</em>
      </h3>
      <div className="flex flex-col gap-4 text-body text-text-muted text-pretty">
        <p>{texte.absatz1}</p>
        <p>{texte.absatz2}</p>
      </div>
    </aside>
  );
}
