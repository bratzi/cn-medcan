import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Stufe } from "@/lib/profil-dashboard";

/**
 * Wie oft du welche Note vergibst (Spec 6): waagerechte Balken ohne
 * Hintergrundspur, Zahl am Ende, häufigste Stufe in Tinte. Die sichtbare
 * Grafik ist aria-hidden, vorgelesen wird die Liste.
 */
export function NotenVerteilung({ stufen, texte }: { stufen: readonly Stufe[]; texte: Woerterbuch["profil"] }) {
  const hoechstens = Math.max(0, ...stufen.map((s) => s.anzahl));
  if (hoechstens === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.verteilungLeer}</p>;
  return (
    <div>
      <ul className="sr-only">
        {stufen.map((s) => (
          <li key={s.stufe}>{t(texte.verteilungStufe, { stufe: s.stufe, anzahl: s.anzahl })}</li>
        ))}
      </ul>
      <div aria-hidden="true" className="flex flex-col gap-2">
        {[...stufen].reverse().map((s) => (
          <div key={s.stufe} className="flex items-center gap-4">
            <span className="numeric w-4 text-small text-text-muted">{s.stufe}</span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {s.anzahl > 0 ? (
                <div
                  data-balken=""
                  // Höchstens 85 %, damit die Zahl daneben im Feld bleibt.
                  style={{ width: `${(s.anzahl / hoechstens) * 85}%` }}
                  className={cn("h-6", s.anzahl === hoechstens ? "bg-text" : "bg-text-muted/40")}
                />
              ) : null}
              <span className="numeric text-small text-text">{s.anzahl}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
