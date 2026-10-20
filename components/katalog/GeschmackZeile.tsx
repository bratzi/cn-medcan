import type { ReactNode } from "react";

import type { GeschmacksKategorie } from "@/db/enums";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { GeschmackEintrag, GeschmackStatus } from "@/lib/katalog/geschmack";

export type GeschmackTexte = Woerterbuch["katalog"]["geschmack"];

/** Marker mit unterscheidbarer Form: der Status bleibt ohne Farbe lesbar (Regel 8). */
const MARKER: Record<GeschmackStatus, string> = { bestaetigt: "✓", nichtBestaetigt: "✕", offen: "○", gefunden: "+" };

/**
 * Pille wie Badge (components/ui/Badge.tsx): gap-1 und py-1 (4 px) als optische Korrektur im Paar
 * Marker und Wort; whitespace-nowrap, weil eine umbrechende Pille kaputt aussieht.
 */
const PILLE = "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-caption whitespace-nowrap";

/**
 * Farbe nur zusätzlich, nur semantische Tokens: bestätigt wie das accent-Badge, nicht bestätigt
 * gedämpft, offen mit gestricheltem Rand, gefunden in kopierstift (die Farbe der Community in der
 * Aroma-Karte). Alle Paare sind in `npm run farben` gemessen (Text auf surface-raised, text auf
 * accent-subtle, kopierstift auf surface-raised).
 */
const TON: Record<GeschmackStatus, string> = {
  bestaetigt: "border-accent bg-accent-subtle text-text",
  nichtBestaetigt: "border-border-strong bg-surface-raised text-text-muted",
  offen: "border-dashed border-border-strong bg-surface-raised text-text-muted",
  gefunden: "border-kopierstift bg-surface-raised text-text",
};

function Marker({ status }: { status: GeschmackStatus }) {
  return (
    <span aria-hidden="true" className={cn("leading-none", status === "gefunden" && "text-kopierstift")}>
      {MARKER[status]}
    </span>
  );
}

/**
 * Geschmäcker einer Katalogkarte (Task 2): gedruckt, je Geschmack eine Pille mit Marker. Sichtbar
 * stehen Marker und Name, vorgelesen wird ein ganzer Satz („Süß, von der Community bestätigt“).
 */
export function GeschmackZeile({
  eintraege,
  texte,
  namen,
}: {
  eintraege: readonly GeschmackEintrag[];
  texte: GeschmackTexte;
  namen: Readonly<Record<GeschmacksKategorie, string>>;
}) {
  if (eintraege.length === 0) {
    return (
      <p data-geschmack className="text-caption text-text-muted">
        {texte.keiner}
      </p>
    );
  }
  return (
    <ul data-geschmack aria-label={texte.titel} className="flex flex-wrap gap-2">
      {eintraege.map(({ geschmack, status }) => (
        <li key={geschmack} className={cn(PILLE, TON[status])}>
          <Marker status={status} />
          <span aria-hidden="true">{namen[geschmack]}</span>
          <span className="sr-only">{t(texte.sr[status], { geschmack: namen[geschmack] })}</span>
        </li>
      ))}
    </ul>
  );
}

function LegendenPille({ status, children }: { status: GeschmackStatus; children: ReactNode }) {
  return (
    <li className={cn(PILLE, TON[status])}>
      <Marker status={status} />
      <span>{children}</span>
    </li>
  );
}

/**
 * Legende einmal über dem Raster, nicht in jeder Karte: dieselben Pillen wie auf den Karten (Gleichheit
 * verknüpft), getrennt nach Datenblatt und Community.
 */
export function GeschmackLegende({ texte }: { texte: GeschmackTexte }) {
  return (
    <div data-legende className="flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-text-muted">
      <div className="flex flex-wrap items-center gap-2">
        <p>{texte.datenblatt}</p>
        <ul className="flex flex-wrap gap-2">
          <LegendenPille status="bestaetigt">{texte.status.bestaetigt}</LegendenPille>
          <LegendenPille status="nichtBestaetigt">{texte.status.nichtBestaetigt}</LegendenPille>
          <LegendenPille status="offen">{texte.status.offen}</LegendenPille>
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p>{texte.community}</p>
        <ul className="flex flex-wrap gap-2">
          <LegendenPille status="gefunden">{texte.status.gefunden}</LegendenPille>
        </ul>
      </div>
    </div>
  );
}
