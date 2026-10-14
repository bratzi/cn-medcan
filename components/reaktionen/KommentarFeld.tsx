"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";

import { schreibeKommentar } from "@/app/[lang]/reaktionen/kommentar-aktionen";
import { buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { KommentarZiel } from "@/db/enums";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { MAX_KOMMENTAR } from "@/lib/kommentar-eingabe";
import type { KommentarAnsicht } from "@/lib/query/kommentare";

type Texte = Woerterbuch["reaktionen"]["kommentare"];

/**
 * Eingabe eines Kommentars: Zähler 0 von 1000, Hinweis zu Wirkversprechen (HWG) und Fehler als
 * Live-Region. Geprüft wird noch einmal in der Server Action; hier gilt nur maxLength.
 */
export function KommentarFeld({
  ziel,
  zielId,
  text,
  beiNeu,
}: {
  ziel: KommentarZiel;
  zielId: string;
  text: Texte;
  beiNeu: (kommentar: KommentarAnsicht) => void;
}) {
  const id = useId();
  const [inhalt, setInhalt] = useState("");
  const [fehler, setFehler] = useState<keyof Texte["fehler"] | "allgemein" | null>(null);
  const [laeuft, starte] = useTransition();

  const senden = () => {
    setFehler(null);
    starte(async () => {
      try {
        const r = await schreibeKommentar(ziel, zielId, inhalt);
        if (r.ok) {
          setInhalt("");
          beiNeu(r.kommentar);
          return;
        }
        setFehler(r.fehler);
      } catch {
        setFehler("allgemein");
      }
    });
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        senden();
      }}
    >
      <label htmlFor={id} className="text-small font-medium text-text">
        {text.feld}
      </label>
      <textarea
        id={id}
        value={inhalt}
        onChange={(e) => setInhalt(e.target.value)}
        maxLength={MAX_KOMMENTAR}
        rows={3}
        placeholder={text.platzhalter}
        aria-describedby={`${id}-hinweis`}
        aria-invalid={fehler !== null && fehler !== "anmelden" && fehler !== "freigabe" ? true : undefined}
        className="min-h-24 w-full resize-y rounded-md border border-border-strong bg-surface p-4 text-body text-text transition-colors duration-fast placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-invalid:border-danger"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p id={`${id}-hinweis`} className="text-caption text-text-muted">
          {text.hinweisHwg}
        </p>
        <p className="numeric text-caption text-text-muted">{t(text.zaehler, { n: inhalt.length, max: MAX_KOMMENTAR })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={laeuft} className={cn(buttonKlassen("secondary", "md"), "disabled:opacity-60")}>
          {text.absenden}
        </button>
        {/* Die Live-Region bleibt im DOM, damit Meldungen angesagt werden; der Fehler steht als Text, nie nur als Farbe. */}
        <p role="alert" className="text-small text-danger">
          {fehler === "anmelden" ? (
            <Link prefetch={false} href="/anmelden" className={textLinkKlassen("inline-flex min-h-11 items-center")}>
              {text.anmelden}
            </Link>
          ) : fehler === "allgemein" ? (
            text.aktionFehler
          ) : fehler ? (
            text.fehler[fehler]
          ) : null}
        </p>
      </div>
    </form>
  );
}
