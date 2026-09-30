"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent, type ReactNode } from "react";

import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import type { GeschmacksKategorie } from "@/db/enums";
import { farbFlaeche, LINIEN_FARBE, VERLAUF } from "@/lib/aroma-farben";
import { verbindungsKarte } from "@/lib/terpen-register";

/** Fertige Texte und Anteile aus TerpenRegister.tsx; die Insel braucht kein Wörterbuch. */
export type RegisterAnsicht = {
  terpene: readonly {
    anker: string;
    name: string;
    /** Katalogname für TerpenIcon (ohne Übersetzung). */
    icon: string;
    sorten: number;
    sortenText: string;
    sortenKurz: string;
    duft: string | null;
    vorkommen: string | null;
    noten: readonly { anker: string; geschmack: GeschmacksKategorie; label: string; anteil: number; haupt: boolean }[];
  }[];
  noten: readonly {
    anker: string;
    geschmack: GeschmacksKategorie;
    label: string;
    traeger: readonly { anker: string; name: string; icon: string; anteil: number; sortenKurz: string }[];
    begleitstoffe: readonly { name: string; hinweis: string; satz: string }[];
  }[];
};

export type RegisterTexte = {
  terpene: string;
  geschmaecker: string;
  terpen: string;
  geschmack: string;
  duft: string;
  vorkommen: string;
  noten: string;
  hauptnote: string;
  traeger: string;
  begleitstoffe: string;
};

type Linie = { terpen: string; note: string; geschmack: GeschmacksKategorie; pfad: string };

/** Linienfarbe wie in der Aroma-Karte; Verlaufsrichtungen nehmen ihre erste Farbe. */
function linienFarbe(geschmack: GeschmacksKategorie): string {
  return LINIEN_FARBE[geschmack] ?? VERLAUF[geschmack]?.[0] ?? "#9aa1a8";
}

/**
 * Eintrag im Register (Nutzer 2026-09-30): frei gesetzt, ohne Kasten und ohne
 * Knopfoptik; Icon über dem Namen, 44 px Trefferfläche. Gewählt in Blattgrün
 * mit Unterstrich, verbunden mit Tintenunterstrich, der Rest tritt zurück.
 */
const EINTRAG =
  "flex min-h-11 min-w-11 flex-col items-center gap-1 px-1 py-2 text-text " +
  "transition-[color,opacity] duration-fast ease-standard hover:text-accent " +
  "aria-pressed:text-accent aria-pressed:underline aria-pressed:decoration-2 aria-pressed:underline-offset-4 " +
  "data-verbunden:underline data-verbunden:decoration-2 data-verbunden:underline-offset-4 data-gedimmt:opacity-60";

/** Querverweis in einer Tafel: gedruckter Name mit Unterstrich, 44 px Trefferfläche. */
const VERWEIS =
  "inline-flex min-h-11 items-center text-left text-body text-text underline decoration-border-strong underline-offset-4 " +
  "transition-colors duration-fast ease-standard hover:decoration-accent";

/**
 * Anteil als schmaler Balken ohne Spur (dataviz), Länge = Anteil an der Note,
 * in der Farbe der Geschmacksrichtung wie die Bögen der Aroma-Karte (T17).
 * Darüber läuft derselbe Lichtfluss (globals.css .bogen-fluss) vom Terpen zum
 * Geschmack. Bei reduzierter Bewegung und im Sparmodus aus, der Balken steht.
 */
function Balken({ anteil, geschmack }: { anteil: number; geschmack: GeschmacksKategorie }) {
  return (
    <span
      aria-hidden="true"
      data-register-balken=""
      data-geschmack={geschmack}
      className="relative block h-2 origin-left overflow-hidden rounded-full"
      style={{ width: `${Math.round(Math.min(1, Math.max(0, anteil)) * 100)}%`, background: farbFlaeche(geschmack) }}
    >
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path
          d="M0 4H100"
          pathLength={100}
          fill="none"
          stroke="var(--color-surface-raised)"
          strokeDasharray="16 184"
          className="bogen-fluss"
          style={{ strokeWidth: 8, opacity: 0.6, "--fluss-dauer": "2.4s", "--fluss-strich": 16 } as CSSProperties}
        />
      </svg>
    </span>
  );
}

/** Farbpunkt einer Geschmacksrichtung in der Pille (8 px), dieselbe Quelle wie die Karte. */
function Farbpunkt({ geschmack }: { geschmack: GeschmacksKategorie }) {
  return <span aria-hidden="true" className="block size-2 shrink-0 rounded-full" style={{ background: farbFlaeche(geschmack) }} />;
}

function Tafel({
  anker,
  aktiv,
  art,
  icon,
  titel,
  unterzeile,
  children,
}: {
  anker: string;
  aktiv: boolean;
  art: string;
  /** Großes Icon neben dem Titel (T17): 48 px, ab sm 64 px, im 8px-Raster. */
  icon: ReactNode;
  titel: string;
  unterzeile?: string;
  children: ReactNode;
}) {
  return (
    <article
      id={anker}
      aria-labelledby={`${anker}-titel`}
      tabIndex={-1}
      data-register-tafel=""
      data-aktiv={aktiv ? "" : undefined}
      className="glas-tafel px-4 py-8 sm:px-10"
    >
      <p data-register-zeile="" className="text-small text-text-muted">
        {art}
      </p>
      <div data-register-zeile="" className="mt-2 flex items-center gap-4 sm:gap-6">
        <span data-register-icon="" className="grid size-12 shrink-0 place-items-center text-text sm:size-16">
          {icon}
        </span>
        <h3 id={`${anker}-titel`} className="min-w-0 font-buch text-kapitel text-text text-balance wrap-break-word hyphens-auto">
          {titel}
        </h3>
      </div>
      {unterzeile ? (
        <p data-register-zeile="" className="mt-2 text-small text-text-muted">
          {unterzeile}
        </p>
      ) : null}
      <dl className="mt-8 grid gap-8">{children}</dl>
    </article>
  );
}

function Eintrag({ begriff, children }: { begriff: string; children: ReactNode }) {
  return (
    <div data-register-zeile="" className="grid gap-2">
      <dt className="text-small font-medium text-text-muted">{begriff}</dt>
      <dd className="text-body text-text text-pretty">{children}</dd>
    </div>
  );
}

/**
 * Das Register "Terpene und Geschmäcker" (T12, Nutzer 2026-09-29): echte
 * Buttons mit aria-pressed und aria-controls wählen genau eine Tafel. Alle
 * Tafeln (article, keine Landmarken) stehen im Server-HTML; `data-aktiv` zeigt die gewählte, ohne
 * JavaScript stehen alle untereinander (globals.css). Ein Querverweis in einer
 * Tafel wechselt die Tafel und setzt den Fokus auf die neue, damit er nicht in
 * einer ausgeblendeten Tafel verloren geht.
 *
 * Verbindung sichtbar (T17, Nutzer 2026-09-30): Hover, Tastaturfokus oder die
 * Auswahl einer Pille heben die verbundenen Pillen der Gegenseite mit Ring
 * hervor und dimmen den Rest; Tippen wählt, erneutes Tippen löst.
 */
export function RegisterAuswahl({ ansicht, start, texte }: { ansicht: RegisterAnsicht; start: string; texte: RegisterTexte }) {
  const [aktiv, setAktiv] = useState(start);
  // Verbindung (T17): Maus-Hover und Tastaturfokus heben vorübergehend hervor; ohne beides gilt
  // die gewählte Pille, außer sie wurde durch erneutes Tippen gelöst.
  const [hervor, setHervor] = useState<string | null>(null);
  const [geloest, setGeloest] = useState(false);
  const fokusNach = useRef<string | null>(null);
  const karte = useMemo(() => verbindungsKarte(ansicht.terpene), [ansicht.terpene]);
  const quelle = hervor ?? (geloest ? null : aktiv);
  const verbunden = new Set(quelle ? (karte[quelle] ?? []) : []);
  const flaeche = useRef<HTMLDivElement>(null);
  const [groesse, setGroesse] = useState<{ b: number; h: number } | null>(null);
  const [linien, setLinien] = useState<Linie[]>([]);

  // Lage der Einträge messen (Nutzer 2026-09-30): Linien von der Unterkante des Terpens zur
  // Oberkante des Geschmacks. Neu bei jeder Größenänderung, auch wenn die Beschreibung wechselt.
  useEffect(() => {
    const wurzel = flaeche.current;
    if (!wurzel || typeof ResizeObserver === "undefined") return;
    const messen = () => {
      const basis = wurzel.getBoundingClientRect();
      const lage = new Map<string, DOMRect>();
      for (const knopf of wurzel.querySelectorAll<HTMLElement>("[data-register-knopf]")) {
        const anker = knopf.getAttribute("aria-controls");
        if (anker) lage.set(anker, knopf.getBoundingClientRect());
      }
      const neu: Linie[] = [];
      for (const terpen of ansicht.terpene) {
        const oben = lage.get(terpen.anker);
        if (!oben) continue;
        for (const note of terpen.noten) {
          const unten = lage.get(note.anker);
          if (!unten) continue;
          const von = { x: oben.left + oben.width / 2 - basis.left, y: oben.bottom - basis.top };
          const nach = { x: unten.left + unten.width / 2 - basis.left, y: unten.top - basis.top };
          const mitteY = (von.y + nach.y) / 2;
          neu.push({
            terpen: terpen.anker,
            note: note.anker,
            geschmack: note.geschmack,
            pfad: `M${von.x},${von.y} C${von.x},${mitteY} ${nach.x},${mitteY} ${nach.x},${nach.y}`,
          });
        }
      }
      setGroesse({ b: basis.width, h: basis.height });
      setLinien(neu);
    };
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(wurzel);
    return () => beobachter.disconnect();
  }, [ansicht.terpene]);

  useEffect(() => {
    if (fokusNach.current !== aktiv) return;
    fokusNach.current = null;
    document.getElementById(aktiv)?.focus();
  }, [aktiv]);

  const waehle = (anker: string, fokus = false) => {
    if (fokus) fokusNach.current = anker;
    setAktiv(anker);
    setGeloest(false);
  };

  /** Tippen wählt aus, erneutes Tippen auf die gewählte Pille löst die Hervorhebung (die Tafel bleibt). */
  const tippe = (anker: string) => {
    if (anker === aktiv) setGeloest((alt) => !alt);
    else waehle(anker);
  };

  /** Gemeinsame Attribute jeder Pille: Verbindungsdaten und Hervorhebung; Hover nur mit Maus oder Stift. */
  const pille = (anker: string) => ({
    "data-verbindung": (karte[anker] ?? []).join(" "),
    "data-quelle": quelle === anker ? "" : undefined,
    "data-verbunden": verbunden.has(anker) ? "" : undefined,
    "data-gedimmt": quelle !== null && quelle !== anker && !verbunden.has(anker) ? "" : undefined,
    onPointerEnter: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== "touch") setHervor(anker);
    },
    onPointerLeave: () => setHervor((alt) => (alt === anker ? null : alt)),
    onFocus: (e: FocusEvent<HTMLButtonElement>) => {
      if (e.currentTarget.matches(":focus-visible")) setHervor(anker);
    },
    onBlur: () => setHervor((alt) => (alt === anker ? null : alt)),
  });

  return (
    <div ref={flaeche} className="register-raster relative isolate mt-16 grid gap-12 md:gap-16">
      {/* Linien vom Terpen hinunter zum Geschmack (Nutzer 2026-09-30): dieselben Bögen und derselbe
          Lichtfluss wie in der Aroma-Karte, in der Farbe der Geschmacksrichtung. Die Beschreibung in
          der Mitte liegt als Violett-Glas (.glas-tafel) darüber: die Linien scheinen weich durch. */}
      {groesse ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 size-full overflow-visible"
          viewBox={`0 0 ${groesse.b} ${groesse.h}`}
        >
          {linien.map((linie, index) => {
            const an = quelle === linie.terpen || quelle === linie.note;
            const farbe = linienFarbe(linie.geschmack);
            return (
              <Fragment key={`${linie.terpen}-${linie.note}`}>
                <path
                  d={linie.pfad}
                  fill="none"
                  stroke={an ? farbe : "var(--color-border-strong)"}
                  strokeLinecap="round"
                  opacity={an ? 0.95 : quelle ? 0.15 : 0.35}
                  style={{ strokeWidth: an ? 2 : 1 }}
                  className="transition-[opacity,stroke] duration-normal"
                />
                {an ? (
                  <path
                    d={linie.pfad}
                    pathLength={100}
                    fill="none"
                    stroke={farbe}
                    strokeLinecap="round"
                    strokeDasharray="16 184"
                    className="bogen-fluss"
                    style={
                      {
                        strokeWidth: 4,
                        opacity: 0.85,
                        animationDelay: `${-((index * 0.37) % 1) * 2.4}s`,
                        "--fluss-dauer": "2.4s",
                        "--fluss-strich": 16,
                      } as CSSProperties
                    }
                  />
                ) : null}
              </Fragment>
            );
          })}
        </svg>
      ) : null}

      <div role="group" aria-labelledby="register-terpene" className="register-knoepfe grid gap-4">
        <h3 id="register-terpene" className="text-small font-medium text-text-muted">
          {texte.terpene}
        </h3>
        <ul className="flex flex-wrap justify-between gap-x-4 gap-y-2">
          {ansicht.terpene.map((terpen) => (
            <li key={terpen.anker}>
              <button
                type="button"
                aria-pressed={aktiv === terpen.anker}
                aria-controls={terpen.anker}
                onClick={() => tippe(terpen.anker)}
                {...pille(terpen.anker)}
                data-register-knopf=""
                className={EINTRAG}
              >
                <TerpenIcon name={terpen.icon} className="size-8" />
                <span className="text-small">{terpen.name}</span>
                <span aria-hidden="true" className="numeric text-caption text-text-muted">
                  {terpen.sorten}
                </span>
                <span className="sr-only">, {terpen.sortenKurz}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="register-tafeln mx-auto grid w-full max-w-3xl content-start">
        {ansicht.terpene.map((terpen) => (
          <Tafel
            key={terpen.anker}
            anker={terpen.anker}
            aktiv={aktiv === terpen.anker}
            art={texte.terpen}
            icon={<TerpenIcon name={terpen.icon} className="size-full" />}
            titel={terpen.name}
            unterzeile={terpen.sortenText}
          >
            {terpen.duft ? <Eintrag begriff={texte.duft}>{terpen.duft}</Eintrag> : null}
            {terpen.vorkommen ? <Eintrag begriff={texte.vorkommen}>{terpen.vorkommen}</Eintrag> : null}
            <Eintrag begriff={texte.noten}>
              <ul className="grid gap-2">
                {terpen.noten.map((note) => (
                  <li key={note.anker} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-4">
                    <button type="button" aria-controls={note.anker} onClick={() => waehle(note.anker, true)} className={`${VERWEIS} gap-2`}>
                      <GeschmackIcon geschmack={note.geschmack} className="size-6" />
                      {note.label}
                    </button>
                    <span className="flex items-center gap-4">
                      <span className="block min-w-0 flex-1">
                        <Balken anteil={note.anteil} geschmack={note.geschmack} />
                      </span>
                      {note.haupt ? <span className="shrink-0 text-small text-text-muted">{texte.hauptnote}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Eintrag>
          </Tafel>
        ))}
        {ansicht.noten.map((note) => (
          <Tafel
            key={note.anker}
            anker={note.anker}
            aktiv={aktiv === note.anker}
            art={texte.geschmack}
            icon={<GeschmackIcon geschmack={note.geschmack} className="size-full" />}
            titel={note.label}
          >
            {note.traeger.length > 0 ? (
              <Eintrag begriff={texte.traeger}>
                <ul className="grid gap-2">
                  {note.traeger.map((terpen) => (
                    <li key={terpen.anker} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-4">
                      <button type="button" aria-controls={terpen.anker} onClick={() => waehle(terpen.anker, true)} className={`${VERWEIS} gap-2`}>
                        <TerpenIcon name={terpen.icon} className="size-6" />
                        {terpen.name}
                      </button>
                      <span className="flex items-center gap-4">
                        <span className="block min-w-0 flex-1">
                          <Balken anteil={terpen.anteil} geschmack={note.geschmack} />
                        </span>
                        <span className="numeric shrink-0 text-small text-text-muted">{terpen.sortenKurz}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Eintrag>
            ) : null}
            {note.begleitstoffe.length > 0 ? (
              <Eintrag begriff={texte.begleitstoffe}>
                <ul className="grid gap-4">
                  {note.begleitstoffe.map((stoff) => (
                    <li key={stoff.name} className="grid gap-2">
                      <span>
                        <span className="font-medium">{stoff.name}</span>
                        {stoff.hinweis ? <span className="text-text-muted">, {stoff.hinweis}</span> : null}
                      </span>
                      {stoff.satz ? <span className="text-small text-text-muted">{stoff.satz}</span> : null}
                    </li>
                  ))}
                </ul>
              </Eintrag>
            ) : null}
          </Tafel>
        ))}
      </div>

      <div role="group" aria-labelledby="register-geschmaecker" className="register-knoepfe grid gap-4">
        <ul className="flex flex-wrap justify-between gap-x-4 gap-y-2">
          {ansicht.noten.map((note) => (
            <li key={note.anker}>
              <button
                type="button"
                aria-pressed={aktiv === note.anker}
                aria-controls={note.anker}
                onClick={() => tippe(note.anker)}
                {...pille(note.anker)}
                data-register-knopf=""
                className={EINTRAG}
              >
                <GeschmackIcon geschmack={note.geschmack} className="size-8" />
                <span className="text-small">{note.label}</span>
                <Farbpunkt geschmack={note.geschmack} />
              </button>
            </li>
          ))}
        </ul>
        <h3 id="register-geschmaecker" className="text-small font-medium text-text-muted">
          {texte.geschmaecker}
        </h3>
      </div>
    </div>
  );
}
