import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Monat } from "@/lib/profil-dashboard";
import { cn } from "@/lib/cn";

/**
 * Bewertungen je Monat (Spec 6): eine Reihe, also Säulen, keine Legende.
 * Werte stehen direkt an den Säulen, darum kein Tooltip. Tinte statt Blattgrün
 * (Regel 4), der laufende Monat dunkler. Höhe als Prozent im style ist
 * Datencodierung, kein Abstand. Die Grafik ist aria-hidden, vorgelesen wird
 * die Tabelle.
 */
export function Aktivitaet({ monate, texte }: { monate: readonly Monat[]; texte: Woerterbuch["profil"] }) {
  const hoechstens = Math.max(0, ...monate.map((m) => m.anzahl));
  if (hoechstens === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.aktivitaetLeer}</p>;
  return (
    <div>
      <div aria-hidden="true" className="flex h-48 items-end gap-2 border-b border-border-strong">
        {monate.map((m) => (
          <div key={m.schluessel} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            {m.anzahl > 0 ? <span className="numeric text-caption text-text">{m.anzahl}</span> : null}
            <div
              data-saeule=""
              style={{ height: `${(m.anzahl / hoechstens) * 100}%` }}
              className={cn(
                "w-full transition-colors duration-fast ease-standard hover:bg-text",
                m.laufend ? "bg-text" : "bg-text-muted/40",
              )}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-2">
        {monate.map((m) => (
          <span key={m.schluessel} className={cn("min-w-0 flex-1 truncate text-center text-caption", m.laufend ? "text-text" : "text-text-muted")}>
            {m.kurz}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{texte.aktivitaetTitel}</caption>
        <thead>
          <tr>
            <th scope="col">{texte.aktivitaetMonat}</th>
            <th scope="col">{texte.aktivitaetAnzahl}</th>
          </tr>
        </thead>
        <tbody>
          {monate.map((m) => (
            <tr key={m.schluessel}>
              <th scope="row">{m.schluessel}</th>
              <td>{m.anzahl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
