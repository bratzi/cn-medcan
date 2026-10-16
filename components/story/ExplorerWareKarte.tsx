import type { CSSProperties } from "react";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { buttonKlassen } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ExplorerWare } from "@/lib/query/sorten-explorer";

type Texte = Woerterbuch["start"]["vertreiber"];

/**
 * Spanne als Balken auf der gemeinsamen Skala der Sorte: der helle Teil reicht bis zum
 * Höchstwert, der dunkle bis zum Mindestwert. Datengrafik in Tinte (ui-design-engine 4),
 * ohne gefüllte Spur; nur eine Grundlinie. Wachsen per `scaleX` (globals.css, `.explorer-balken`).
 */
function Balken({ stoff, spanne, skala, texte, sprache }: { stoff: string; spanne: [number, number]; skala: number; texte: Texte; sprache: Sprache }) {
  const anteil = (wert: number) => (skala > 0 ? Math.min(1, wert / skala) : 0);
  const text = t(texte.spanne, { von: formatiereZahl(spanne[0], 1, sprache), bis: formatiereZahl(spanne[1], 1, sprache) });
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline justify-between gap-4 text-small">
        <span className="text-text-muted">{stoff}</span>
        <span className="numeric text-text">{text}</span>
      </p>
      <span aria-hidden="true" className="relative block h-2 border-b border-border">
        <span
          className="explorer-balken absolute inset-y-0 left-0 w-full origin-left bg-text-muted opacity-40"
          style={{ "--anteil": anteil(spanne[1]) } as CSSProperties}
        />
        <span
          className="explorer-balken absolute inset-y-0 left-0 w-full origin-left bg-text"
          style={{ "--anteil": anteil(spanne[0]) } as CSSProperties}
        />
      </span>
    </div>
  );
}

type Props = {
  ware: ExplorerWare;
  index: number;
  skala: number;
  gewaehlt: boolean;
  imVergleich: boolean;
  /** Erst ab zwei Vertreibern gibt es etwas zu vergleichen. */
  vergleichbar: boolean;
  texte: Texte;
  sprache: Sprache;
  onWaehlen: () => void;
  onVergleichen: () => void;
};

/** Eine Ware im Regal des Sorten-Explorers (Spec 2026-10-15 Abschnitt 4). */
export function ExplorerWareKarte({ ware, index, skala, gewaehlt, imVergleich, vergleichbar, texte, sprache, onWaehlen, onVergleichen }: Props) {
  return (
    <li className="explorer-karte flex flex-col gap-2" style={{ "--i": index } as CSSProperties}>
      <button
        type="button"
        aria-pressed={gewaehlt}
        onClick={onWaehlen}
        className={cn(
          "explorer-druck flex flex-1 flex-col gap-4 border bg-surface-raised p-6 text-left transition-colors duration-fast ease-standard",
          gewaehlt ? "border-accent bg-accent-subtle" : "border-border hover:border-border-strong",
        )}
      >
        <span className="font-buch text-h3 font-medium text-balance text-text wrap-break-word">{ware.vertreiberName}</span>
        <Balken stoff="THC" spanne={ware.thc} skala={skala} texte={texte} sprache={sprache} />
        <Balken stoff="CBD" spanne={ware.cbd} skala={skala} texte={texte} sprache={sprache} />
        <span className="flex flex-wrap gap-x-4 gap-y-2 text-small text-text-muted">
          <span className="numeric">{mehrzahl(sprache, texte.staerken, ware.staerken)}</span>
          <span className="numeric">{ware.anzahl > 0 ? mehrzahl(sprache, texte.bewertungen, ware.anzahl) : texte.ohneBewertung}</span>
        </span>
        {ware.note !== null ? (
          <BlattAnzeige note={ware.note} text={t(texte.overall, { note: formatiereZahl(ware.note, 1, sprache) })} />
        ) : null}
      </button>
      {vergleichbar ? (
        <button
          type="button"
          aria-pressed={imVergleich}
          onClick={onVergleichen}
          className={buttonKlassen(imVergleich ? "secondary" : "ghost", "sm", "self-start aria-pressed:border-accent")}
        >
          {texte.vergleichen}
          <span className="sr-only"> {ware.vertreiberName}</span>
        </button>
      ) : null}
    </li>
  );
}
