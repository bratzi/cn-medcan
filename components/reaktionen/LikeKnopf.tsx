"use client";

import { useState, useTransition } from "react";

import type { ZielArt } from "@/db/enums";
import { useEigeneLikes } from "@/components/reaktionen/EigeneLikes";
import { schalteLike } from "@/app/[lang]/reaktionen/aktionen";

/**
 * Herz mit Zahl (Spec Strang A). Die Zahl kommt statisch aus dem Zähler der Elternseite; ob ich
 * geliket habe, lädt nur diese Insel nach, damit die Seite statisch bleibt. Optimistisch mit
 * Rücksprung bei Fehler mit kurzer Meldung. Bei `art="MITGLIED"` heißt der Knopf „Folgen“.
 */
export function LikeKnopf({
  art,
  zielId,
  anzahl: start,
  text,
}: {
  art: ZielArt;
  zielId: string;
  anzahl: number;
  text: { moegen: string; folgen: string; anmelden: string; selbst: string; weg: string };
}) {
  const [anzahl, setAnzahl] = useState(start);
  // Ob ich schon gemocht habe, liefert der Sammler der Seite (eine Abfrage für alle Herzen); null = noch nicht angefasst.
  const aus = useEigeneLikes(art, zielId);
  const [lokal, setAn] = useState<boolean | null>(null);
  const an = lokal ?? aus;
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  const klick = () => {
    const vorher = anzahl;
    const warAn = an;
    setHinweis(null);
    setAn(!warAn);
    setAnzahl(vorher + (warAn ? -1 : 1));
    starte(async () => {
      try {
        const r = await schalteLike(art, zielId);
        if (r.ok) {
          setAn(r.geliket);
          setAnzahl(r.likes);
          return;
        }
        setAn(warAn);
        setAnzahl(vorher);
        setHinweis(r.fehler === "selbst" ? text.selbst : r.fehler === "weg" ? text.weg : text.anmelden);
      } catch {
        setAn(warAn);
        setAnzahl(vorher);
      }
    });
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={klick}
        disabled={laeuft}
        aria-pressed={an}
        aria-label={art === "MITGLIED" ? text.folgen : text.moegen}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 text-small text-text-muted transition-colors duration-fast hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-pressed:text-accent disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill={an ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
        <span className="numeric">{anzahl}</span>
      </button>
      {hinweis ? (
        <span role="status" className="text-small text-text-muted">
          {hinweis}
        </span>
      ) : null}
    </span>
  );
}
