"use client";

import Link from "next/link";
import { useId, useImperativeHandle, useRef, useState, useTransition, type Ref } from "react";

import { schreibeKommentar } from "@/app/[lang]/reaktionen/kommentar-aktionen";
import { buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { KommentarZiel } from "@/db/enums";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { MAX_KOMMENTAR } from "@/lib/kommentar-eingabe";
import type { KommentarAnsicht } from "@/lib/query/kommentare";

type Texte = Woerterbuch["reaktionen"]["kommentare"];

export type KommentarFeldSteuerung = { antworten: (name: string) => void };

/**
 * Eingabe eines Kommentars: Zähler 0 von 1000, Hinweis zu Wirkversprechen (HWG) und Fehler als
 * Live-Region. Geprüft wird noch einmal in der Server Action; hier gilt nur maxLength.
 */
export function KommentarFeld({
  ziel,
  zielId,
  text,
  beiNeu,
  steuerung,
}: {
  ziel: KommentarZiel;
  zielId: string;
  text: Texte;
  beiNeu: (kommentar: KommentarAnsicht) => void;
  /** „Antworten“ an einem Eintrag: setzt „@Name “ an den Anfang und holt den Fokus. */
  steuerung?: Ref<KommentarFeldSteuerung>;
}) {
  const id = useId();
  const [inhalt, setInhalt] = useState("");
  const feld = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(steuerung, () => ({
    antworten(name: string) {
      const vorsatz = `@${name} `;
      setInhalt((alt) => (alt.startsWith(vorsatz) ? alt : vorsatz + alt));
      const el = feld.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    },
  }));
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
    // Composer im Social-Media-Stil (Nutzer 2026-10-22): eine Fläche, Feld ohne Rahmen, unten Hinweis,
    // Zähler und Senden. Der HWG-Hinweis bleibt sichtbar am Feld.
    <form
      className="flex flex-col rounded-2xl border border-border bg-surface transition-[border-color,box-shadow] duration-fast ease-out focus-within:border-accent focus-within:ring-1 focus-within:ring-accent"
      onSubmit={(e) => {
        e.preventDefault();
        senden();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {text.feld}
      </label>
      <textarea
        ref={feld}
        id={id}
        value={inhalt}
        onChange={(e) => setInhalt(e.target.value)}
        maxLength={MAX_KOMMENTAR}
        rows={2}
        placeholder={text.platzhalter}
        aria-describedby={`${id}-hinweis`}
        aria-invalid={fehler !== null && fehler !== "anmelden" && fehler !== "freigabe" ? true : undefined}
        className="field-sizing-content min-h-16 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-body text-text placeholder:text-text-muted focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2">
        <p id={`${id}-hinweis`} className="max-w-[44ch] text-caption text-pretty text-text-muted">
          {text.hinweisHwg}
        </p>
        <div className="flex items-center gap-3">
          <p className="numeric text-caption text-text-muted">{t(text.zaehler, { n: inhalt.length, max: MAX_KOMMENTAR })}</p>
          <button
            type="submit"
            disabled={laeuft || inhalt.trim() === ""}
            className={cn(buttonKlassen("primary", "sm"), "transition-[scale,opacity] active:scale-97 disabled:opacity-50")}
          >
            {text.absenden}
          </button>
        </div>
      </div>
      {/* Die Live-Region bleibt im DOM, damit Meldungen angesagt werden; der Fehler steht als Text, nie nur als Farbe. */}
      <p role="alert" className="px-4 text-small text-danger empty:hidden">
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
    </form>
  );
}
