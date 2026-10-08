import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte } from "@/lib/profil-typen";

type Terpen = ProfilWerte["terpene"][number];
type Props = { terpene: ProfilWerte["terpene"]; texte: Woerterbuch["profil"]; sprache: Sprache; ohneTitel?: boolean };

/**
 * Terpene des Profils als Rangliste (Spec Profil 5.1): Balken in Tinte, Länge
 * relativ zum stärksten. Abgelehnte stehen abgesetzt unter „eher nicht“,
 * gestrichelt umrandet ohne Fläche. Nur Aroma (HWG).
 */
export function TerpenRangliste({ terpene, texte, sprache, ohneTitel }: Props) {
  if (terpene.length === 0) return null;
  const positiv = terpene.filter((e) => e.wert > 0);
  const negativ = terpene.filter((e) => e.wert < 0);
  const zeile = (e: Terpen, abgelehnt: boolean) => (
    <li key={e.name} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-4">
      <span className="truncate text-small text-text">{terpenAnzeige(e.name, sprache)}</span>
      <span className="block h-2 w-full" aria-hidden="true">
        <span
          className={abgelehnt ? "block h-2 border border-dashed border-text" : "block h-2 border border-text bg-text/12"}
          style={{ width: `${Math.round(Math.abs(e.wert) * 100)}%` }}
        />
      </span>
    </li>
  );
  return (
    <div className="flex w-full flex-col gap-4">
      {ohneTitel ? null : <h3 className="text-small font-medium text-text">{texte.terpeneTitel}</h3>}
      {positiv.length > 0 ? <ol className="flex flex-col gap-2">{positiv.map((e) => zeile(e, false))}</ol> : null}
      {negativ.length > 0 ? (
        <>
          <p className="text-caption tracking-wide text-text-muted">{texte.terpeneEherNicht}</p>
          <ol className="flex flex-col gap-2">{negativ.map((e) => zeile(e, true))}</ol>
        </>
      ) : null}
    </div>
  );
}
