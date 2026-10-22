"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { ladeKommentareSeite, loescheKommentar, meldeKommentar } from "@/app/[lang]/reaktionen/kommentar-aktionen";
import { KommentarFeld } from "@/components/reaktionen/KommentarFeld";
import { Avatar, buttonKlassen, namenLinkKlassen } from "@/components/ui";
import type { KommentarZiel } from "@/db/enums";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { cursorKodieren } from "@/lib/kommentar-cursor";
import { MAX_MELDEGRUND } from "@/lib/kommentar-eingabe";
import { profilHref } from "@/lib/kurz-id";
import type { KommentarAnsicht } from "@/lib/query/kommentare";

type Texte = Woerterbuch["reaktionen"]["kommentare"];

const TEXTKNOPF =
  "inline-flex min-h-11 items-center rounded-full px-2 text-small text-text-muted transition-colors duration-fast hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60";

function cursorVon(e: KommentarAnsicht): string {
  return cursorKodieren({ erstelltAm: new Date(e.erstelltAm), id: e.id });
}

/**
 * Kommentare zu einer Bewertung oder auf der Pinnwand eines Profils. Aufklappbar „Kommentare (n)“;
 * die Liste lädt erst beim ersten Aufklappen (eine Server Action je Bewertung, nie beim Laden der Seite).
 * Mit `start` (Pinnwand auf einer ohnehin dynamischen Seite) steht die erste Seite schon da.
 * Das Ziel muss öffentlich sein: das prüfen die Seite und die Action, nicht diese Insel.
 */
export function Kommentare({
  ziel,
  zielId,
  anzahl,
  text,
  sprache = "de",
  start,
  offen = false,
  titel,
}: {
  ziel: KommentarZiel;
  zielId: string;
  anzahl: number;
  text: Texte;
  sprache?: Sprache;
  start?: { eintraege: KommentarAnsicht[]; weitere: boolean };
  offen?: boolean;
  /** Überschrift statt „Kommentare“, etwa „Pinnwand“. */
  titel?: string;
}) {
  const [eintraege, setEintraege] = useState<KommentarAnsicht[]>(start?.eintraege ?? []);
  const [weitere, setWeitere] = useState(start?.weitere ?? false);
  // Cursor nur aus geladenen Seiten, nie aus eigenen neuen Kommentaren: sonst fehlten Einträge dazwischen.
  const [cursor, setCursor] = useState<string | undefined>(
    start && start.eintraege.length > 0 ? cursorVon(start.eintraege[start.eintraege.length - 1]) : undefined,
  );
  const [geladen, setGeladen] = useState(Boolean(start));
  const [ladeFehler, setLadeFehler] = useState(false);
  const [differenz, setDifferenz] = useState(0);
  const [laedt, starteLaden] = useTransition();
  const laeuftSchon = useRef(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const anker = `kommentare-${zielId}`;

  // Ein Link auf `#kommentare-<id>` (auch von derselben Seite aus) klappt den Bereich auf und scrollt dorthin.
  useEffect(() => {
    const oeffneBeiHash = () => {
      if (window.location.hash !== `#${anker}`) return;
      const d = detailsRef.current;
      if (!d) return;
      d.open = true;
      d.scrollIntoView({ block: "start" });
    };
    oeffneBeiHash();
    window.addEventListener("hashchange", oeffneBeiHash);
    return () => window.removeEventListener("hashchange", oeffneBeiHash);
  }, [anker]);

  const gesamt = Math.max(0, anzahl + differenz);

  const lade = (vor?: string) => {
    if (laeuftSchon.current) return;
    laeuftSchon.current = true;
    setLadeFehler(false);
    starteLaden(async () => {
      try {
        const r = await ladeKommentareSeite(ziel, zielId, vor);
        if (!r.ok) {
          setLadeFehler(true);
          return;
        }
        setEintraege((alt) => {
          const bekannt = new Set(alt.map((e) => e.id));
          return [...alt, ...r.eintraege.filter((e) => !bekannt.has(e.id))];
        });
        setWeitere(r.weitere);
        if (r.eintraege.length > 0) setCursor(cursorVon(r.eintraege[r.eintraege.length - 1]));
        setGeladen(true);
      } catch {
        setLadeFehler(true);
      } finally {
        laeuftSchon.current = false;
      }
    });
  };

  return (
    <details
      ref={detailsRef}
      id={anker}
      className="group flex flex-col gap-4 scroll-mt-24 border-t border-border pt-4"
      open={offen || undefined}
      onToggle={(e) => {
        if (e.currentTarget.open && !geladen && !laedt) lade();
      }}
    >
      {/* Kopf als Zeile über die volle Breite (Nutzer 2026-10-22: mehr Fokus): Wort gedruckt, Zahl in
          Handschrift, darunter was einen erwartet; rechts der Pfeil in eigener 44-px-Fläche. */}
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-2 transition-colors duration-fast ease-standard hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2">
            <span className="font-buch text-h3 font-medium text-text">{titel ?? text.titel}</span>
            <span aria-hidden="true" className="font-hand text-vermerk text-logo">
              {gesamt}
            </span>
            <span className="sr-only">{mehrzahl(sprache, text.anzahlSr, gesamt)}</span>
          </span>
          <span className="text-small text-text-muted">{gesamt === 0 ? text.unterzeileLeer : text.unterzeile}</span>
        </span>
        <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-text-muted transition-[color,border-color,rotate] duration-normal ease-out group-open:rotate-90 group-hover:border-accent group-hover:text-accent">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </summary>

      <div className="flex flex-col gap-4">
        {laedt && !geladen ? (
          <p role="status" className="text-small text-text-muted">
            {text.laden}
          </p>
        ) : null}
        {ladeFehler ? (
          <p role="alert" className="flex flex-wrap items-center gap-2 text-small text-text-muted">
            {text.ladenFehler}
            <button type="button" onClick={() => lade(cursor)} className={TEXTKNOPF}>
              {text.mehr}
            </button>
          </p>
        ) : null}
        {geladen && eintraege.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center">
            <p className="font-buch text-body font-medium text-text">{text.leer}</p>
            <p className="max-w-[48ch] text-small text-pretty text-text-muted">{text.leerAufruf}</p>
          </div>
        ) : null}

        {eintraege.length > 0 ? (
          <ol className="flex flex-col divide-y divide-border">
            {eintraege.map((k) => (
              <Eintrag
                key={k.id}
                k={k}
                text={text}
                sprache={sprache}
                beiWeg={() => {
                  setEintraege((alt) => alt.filter((e) => e.id !== k.id));
                  setDifferenz((d) => d - 1);
                }}
              />
            ))}
          </ol>
        ) : null}

        {weitere ? (
          <button
            type="button"
            disabled={laedt}
            onClick={() => lade(cursor)}
            className={cn(buttonKlassen("secondary", "md"), "w-fit disabled:opacity-60")}
          >
            {text.mehr}
          </button>
        ) : null}

        <KommentarFeld
          ziel={ziel}
          zielId={zielId}
          text={text}
          beiNeu={(k) => {
            setEintraege((alt) => (alt.some((e) => e.id === k.id) ? alt : [...alt, k]));
            setDifferenz((d) => d + 1);
            setGeladen(true);
          }}
        />
      </div>
    </details>
  );
}

function Eintrag({ k, text, sprache, beiWeg }: { k: KommentarAnsicht; text: Texte; sprache: Sprache; beiWeg: () => void }) {
  const [laeuft, starte] = useTransition();
  const [meldung, setMeldung] = useState<"gemeldet" | "fehler" | null>(null);
  const [grund, setGrund] = useState("");
  const name = k.autor.name;

  const loesche = () =>
    starte(async () => {
      try {
        const r = await loescheKommentar(k.id);
        if (r.ok) beiWeg();
        else setMeldung("fehler");
      } catch {
        setMeldung("fehler");
      }
    });

  const melde = () =>
    starte(async () => {
      try {
        const r = await meldeKommentar(k.id, grund);
        setMeldung(r.ok ? "gemeldet" : "fehler");
      } catch {
        setMeldung("fehler");
      }
    });

  return (
    <li className="flex gap-4 py-4 first:pt-0">
      <Avatar name={name} bildId={k.autor.avatarId} groesse="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-small">
          <span className="font-medium text-text wrap-break-word">
            {k.autor.kurzId ? (
              <Link prefetch={false} href={profilHref(k.autor.kurzId)} className={namenLinkKlassen()}>
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
          <time dateTime={k.erstelltAm} title={formatiereDatum(k.erstelltAm, sprache)} suppressHydrationWarning className="text-caption text-text-muted">
            {formatiereRelativ(k.erstelltAm, undefined, sprache)}
          </time>
        </p>
        <p className="text-body text-text whitespace-pre-line break-words">{k.text}</p>
        <div className="flex flex-wrap items-center gap-x-2">
          {k.darfLoeschen ? (
            <button type="button" onClick={loesche} disabled={laeuft} aria-label={t(text.loeschenFuer, { name })} className={TEXTKNOPF}>
              {text.loeschen}
            </button>
          ) : meldung === "gemeldet" ? null : (
            <details className="w-full">
              <summary
                aria-label={t(text.meldenFuer, { name })}
                className={cn(TEXTKNOPF, "w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden")}
              >
                {text.melden}
              </summary>
              <div className="flex flex-col gap-2 pb-2">
                <label className="text-small text-text">
                  {text.grund}
                  <input
                    type="text"
                    value={grund}
                    onChange={(e) => setGrund(e.target.value)}
                    maxLength={MAX_MELDEGRUND}
                    className="mt-1 h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  />
                </label>
                <button type="button" onClick={melde} disabled={laeuft} className={cn(buttonKlassen("secondary", "md"), "w-fit disabled:opacity-60")}>
                  {text.meldenSenden}
                </button>
              </div>
            </details>
          )}
        </div>
        <p role="status" className="text-small text-text-muted">
          {meldung === "gemeldet" ? text.gemeldet : meldung === "fehler" ? text.aktionFehler : null}
        </p>
      </div>
    </li>
  );
}
