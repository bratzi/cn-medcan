import { InfoKnopf } from "@/components/ui/InfoKnopf";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Sachliche Einordnung neben der Aroma-Karte (Spec Redesign 14). Bewusst
 * ohne Wirk- oder Heilversprechen zu einzelnen Terpenen oder Produkten
 * (§ 10 HWG, verschreibungspflichtige Arzneimittel): nur, woran die
 * Einteilung Sativa/Indica scheitert und worauf wir stattdessen schauen.
 * Seit 2026-10-21 (Nutzer: weniger Textrauschen) nur die Frage, die Absätze
 * hinter dem Info-Knopf.
 */
export function Aufklaerung({ texte, sprache }: { texte: Woerterbuch["aroma"]["aufklaerung"]; sprache: Sprache }) {
  return (
    <aside className="mt-8 flex max-w-4xl items-center gap-2 border-t border-border pt-8">
      <h3 className="font-buch text-h3 font-medium text-text text-balance">
        {texte.frage} <em className="farbverlauf hand-betont">{texte.betont}</em>
      </h3>
      <InfoKnopf
        sprache={sprache}
        text={
          <>
            {texte.absatz1}
            <br />
            <br />
            {texte.absatz2}
          </>
        }
      />
    </aside>
  );
}
