"use client";

import { useState } from "react";

import type { GeschmacksKategorie } from "@/db/enums";
import { cn } from "@/lib/cn";
import { terpenTaste, terpenZeiger } from "@/lib/regler-raster";
import { weitereOffen } from "@/lib/aromakarte";
import { formatiereWert } from "@/lib/format";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { t } from "@/lib/i18n/text";
import type { AromaTexte } from "@/lib/i18n/typen";
import { INTENSITAETS_STUFEN } from "@/lib/query/bewertung";

export type KatalogEintrag = { name: string; geschmack: GeschmacksKategorie };

export type TerpenZeile = {
  terpen: string;
  /** Community-Median (T5, zuvor das Mittel), 0 bis 5. */
  wert: number;
  /** Wie viele Bewertungen dahinterstehen; ohne Anzahl kein Community-Ring. */
  anzahl?: number;
};

function einordnung(wert: number, texte: AromaTexte): string {
  if (wert < 0.5) return texte.schema.nichtGeschmeckt;
  const naechste = INTENSITAETS_STUFEN.reduce((a, b) => (Math.abs(b.wert - wert) < Math.abs(a.wert - wert) ? b : a));
  return texte.schema.intensitaet[naechste.wert];
}

/** Skala 0 bis 5, wie die Aroma-Karte; 0 heißt nicht geschmeckt. */
const MAX = 5;

function anteil(wert: number): number {
  return (Math.min(Math.max(wert, 0), MAX) / MAX) * 100;
}

/**
 * Wert unter dem Zeiger: genau die Position des sichtbaren Punkts, ohne den
 * Daumen-Einzug des nativen Reglers, auf ganze Stufen gerastet.
 */
function wertAmZeiger(spur: HTMLElement, clientX: number): number {
  const rect = spur.getBoundingClientRect();
  const roh = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * MAX;
  // Ganze Stufen wie gespeichert, kein Einrasten auf den Median (T20).
  return terpenZeiger(roh);
}

type Bedienung = {
  /** Eigener Wert je Terpen; ohne Eintrag steht der Regler auf 0. */
  eigen: Readonly<Record<string, number>>;
  aendern: (terpen: string, wert: number) => void;
};

/**
 * Terpen-Regler der Bewertungsmaske (T5d, Nutzer 2026-09-30, ersetzt Sweet Spot
 * und „Terpen ergänzen“): je Terpen eine Spur 0 bis 5 mit dem eigenen Wert als
 * Punkt und dem Community-Median als grünem Ring. Die Herstellerterpene stehen
 * vorn; alle übrigen bekannten Terpene liegen zugeklappt darunter, damit die
 * Maske nicht überläuft. Ein nicht angegebenes Terpen gilt als ergänzt, sobald
 * sein Regler über 0 steht (lib/aromakarte.ts, terpenEbenen), auf 0 fällt es weg.
 */
export function TerpenRegler({
  titel,
  hersteller,
  weitere,
  zeilen,
  bedienung,
  texte,
}: {
  titel: string;
  /** Terpene laut Hersteller, in ihrer Reihenfolge. */
  hersteller: readonly string[];
  /** Alle übrigen bekannten Terpene (lib/aromakarte.ts, reglerTerpene). */
  weitere: readonly string[];
  /** Community-Median je Terpen. */
  zeilen: readonly TerpenZeile[];
  bedienung: Bedienung;
  texte: AromaTexte;
}) {
  const tr = texte.aroma.terpenRegler;
  const median = new Map(zeilen.map((zeile) => [zeile.terpen, zeile]));
  const ergaenztAnzahl = weitere.filter((name) => (bedienung.eigen[name] ?? 0) > 0).length;
  // Offen-Zustand gehört nach dem Start dem Nutzer (Review 1): nur der Anfang kommt aus den
  // Ergänzungen; zieht er eine Ergänzung auf 0 zurück, klappt nichts mitten im Ziehen zu.
  const [offen, setOffen] = useState(() => weitereOffen(false, ergaenztAnzahl, hersteller.length));
  const spur = (name: string, ergaenzbar: boolean) => (
    <Spur key={name} name={name} zeile={median.get(name)} ergaenzbar={ergaenzbar} bedienung={bedienung} texte={texte} />
  );
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-buch text-h3 font-medium text-text text-balance">{titel}</h3>
      {hersteller.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{hersteller.map((name) => spur(name, false))}</ul>
      ) : null}
      {weitere.length > 0 ? (
        // Zugeklappt, solange nichts ergänzt ist; mit Ergänzungen (z. B. aus der eigenen
        // gespeicherten Bewertung) offen, damit sie sichtbar bleiben.
        <details
          open={offen}
          onToggle={(e) => setOffen(e.currentTarget.open)}
          className="flex flex-col gap-3"
        >
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md text-small font-medium text-text hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            {tr.weitere}
            <span className="numeric text-text-muted">({weitere.length})</span>
          </summary>
          <p className="mb-3 max-w-[60ch] text-caption text-text-muted text-pretty">{tr.weitereHinweis}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{weitere.map((name) => spur(name, true))}</ul>
        </details>
      ) : null}
    </section>
  );
}

function Spur({
  name,
  zeile,
  ergaenzbar,
  bedienung,
  texte,
}: {
  name: string;
  zeile: TerpenZeile | undefined;
  ergaenzbar: boolean;
  bedienung: Bedienung;
  texte: AromaTexte;
}) {
  const sprache = texte.sprache;
  const tr = texte.aroma.terpenRegler;
  const gezeigt = bedienung.eigen[name] ?? 0;
  const ergaenzt = ergaenzbar && gezeigt > 0;
  const ring = zeile?.anzahl ? zeile.wert : undefined;
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-surface-raised p-4",
        ergaenzt ? "border-dashed border-kopierstift" : "border-border",
        gezeigt < 0.05 && "opacity-70",
      )}
    >
      <div className="flex flex-col">
        <span className="font-buch text-body font-medium text-text">
          {terpenAnzeige(name, sprache)}
          {ergaenzbar ? <span className="ml-2 text-caption font-normal text-text-muted">{tr.nichtAngegeben}</span> : null}
        </span>
        <span className="numeric text-small text-text-muted">
          {`${einordnung(gezeigt, texte)} · ${t(texte.aroma.vonFuenf, { wert: formatiereWert(gezeigt, sprache) })}`}
          {ring !== undefined ? ` · ${t(tr.community, { wert: formatiereWert(ring, sprache) })}` : ""}
        </span>
      </div>
      <div
        className="relative h-3 cursor-pointer touch-none rounded-full bg-border outline-offset-8 outline-focus-ring has-[input:focus-visible]:outline-2"
        onPointerDown={(e) => {
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          el.querySelector("input")?.focus();
          bedienung.aendern(name, wertAmZeiger(el, e.clientX));
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          bedienung.aendern(name, wertAmZeiger(e.currentTarget, e.clientX));
        }}
      >
        {/* Community-Median: grüner Ring, eine Stufe größer als der eigene Punkt, damit er
            ihn umschließt, wenn beide gleich sind; Saum in Papierfarbe. */}
        {ring !== undefined ? (
          <span
            aria-hidden="true"
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent ring-2 ring-surface"
            style={{ left: `${anteil(ring)}%` }}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm"
          style={{ left: `${anteil(gezeigt)}%` }}
        />
        <input
          type="range"
          min={0}
          max={MAX}
          // Ganze Stufen wie gespeichert (T20); eigene Tasten, damit Pos1/Ende/Bild-Tasten stimmen.
          step={1}
          value={gezeigt}
          onKeyDown={(e) => {
            const neu = terpenTaste(e.key, gezeigt);
            if (neu === null) return;
            e.preventDefault();
            bedienung.aendern(name, neu);
          }}
          aria-label={t(tr.intensitaetVon, { terpen: terpenAnzeige(name, sprache) })}
          aria-valuetext={`${einordnung(gezeigt, texte)}, ${t(texte.aroma.vonFuenf, { wert: formatiereWert(gezeigt, sprache) })}`}
          onChange={(e) => bedienung.aendern(name, Number(e.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 opacity-0"
        />
      </div>
      <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
        <span>{tr.schwach}</span>
        <span>{tr.stark}</span>
      </div>
    </li>
  );
}
