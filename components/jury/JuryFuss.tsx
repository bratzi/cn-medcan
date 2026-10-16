import Link from "next/link";

import { einzelLinkKlassen } from "@/components/ui/textlink";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Fuß jeder Jury-Seite: der HWG-Hinweis (nur Aussehen, Geruch, Geschmack, keine Aussagen zur
 * Wirkung) und die Wege zu den Schwesterseiten.
 */
export function JuryFuss({ texte }: { texte: Woerterbuch["jury"] }) {
  return (
    <footer className="flex flex-col gap-4 border-t border-border pt-8">
      <nav aria-label={texte.titel} className="flex flex-wrap gap-x-6">
        <Link prefetch={false} href="/jury" className={einzelLinkKlassen()}>
          {texte.titel}
        </Link>
        <Link prefetch={false} href="/jury/favourites" className={einzelLinkKlassen()}>
          {texte.favourites}
        </Link>
        <Link prefetch={false} href="/jury/team" className={einzelLinkKlassen()}>
          {texte.team}
        </Link>
      </nav>
      <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.hwg}</p>
    </footer>
  );
}
