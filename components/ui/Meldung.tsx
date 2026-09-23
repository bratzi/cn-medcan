import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MeldungArt = "fehler" | "erfolg";

type Stil = {
  /** `alert` unterbricht, `status` wird nachgereicht - Fehler unterbricht. */
  rolle: "alert" | "status";
  farbe: string;
  marker: string;
};

const STILE: Record<MeldungArt, Stil> = {
  fehler: { rolle: "alert", farbe: "text-danger", marker: "Fehler: " },
  erfolg: { rolle: "status", farbe: "text-success", marker: "Erledigt: " },
};

export type MeldungProps = {
  art: MeldungArt;
  children: ReactNode;
  /**
   * Ersetzt den Wortmarker. Er entfaellt nie: die Aussage darf nicht allein
   * an der Farbe haengen - in Graustufen und fuer Screenreader traegt sie
   * dieses Wort.
   */
  marker?: string;
  className?: string;
};

/**
 * Rueckmeldung einer Aktion als Satz - kein Kasten, keine Farbflaeche.
 *
 * Das Muster stand dreimal gleich in `components/auth` und `components/admin`
 * und kommt mit der Umfrageverwaltung an fuenf weiteren Stellen vor. Die
 * aelteren Stellen sind noch nicht umgestellt.
 */
export function Meldung({ art, children, marker, className }: MeldungProps) {
  const stil = STILE[art];
  return (
    <p role={stil.rolle} className={cn("text-small", stil.farbe, className)}>
      <span className="font-medium">{marker ?? stil.marker}</span>
      {children}
    </p>
  );
}
