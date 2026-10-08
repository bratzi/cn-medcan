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
      <div aria-hidden="true" className="flex gap-2 border-b border-border-strong pt-6">
        {monate.map((m) => {
          const hoehe = (m.anzahl / hoechstens) * 100;
          return (
            <div key={m.schluessel} className="relative h-48 min-w-0 flex-1">
              <div
                data-saeule=""
                style={{ height: `${hoehe}%` }}
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-colors duration-fast ease-standard hover:bg-text",
                  m.laufend ? "bg-text" : "bg-text-muted/40",
                )}
              />
              {/* Geschwister der Säule: die Zahl wird beim Wachsen nicht mitgestaucht. */}
              {m.anzahl > 0 ? (
                <span
                  data-wert=""
                  style={{ bottom: `calc(${hoehe}% + 8px)` }}
                  className="numeric absolute inset-x-0 text-center text-caption text-text"
                >
                  {m.anzahl}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-2">
        {monate.map((m) => (
          <span key={m.schluessel} className={cn("min-w-0 flex-1 text-center text-caption", m.laufend ? "text-text" : "text-text-muted")}>
            <span className="sm:hidden">{m.kurz.slice(0, 1)}</span>
            <span className="hidden sm:inline">{m.kurz}</span>
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
              <th scope="row">{`${m.kurz} ${m.schluessel.slice(0, 4)}`}</th>
              <td>{m.anzahl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
