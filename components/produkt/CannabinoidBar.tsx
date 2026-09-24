import { cn } from "@/lib/cn";
import { formatiereProzent, formatiereProzentSpanne, type Dezimalwert } from "@/lib/format";

/** Obergrenze der Skala: reale Blueten liegen unterhalb von 35 % THC. */
const SKALA_MAX = 35;

export type CannabinoidBarProps = {
  thcMin?: Dezimalwert | null;
  thcMax?: Dezimalwert | null;
  cbdMin?: Dezimalwert | null;
  cbdMax?: Dezimalwert | null;
  className?: string;
};

function zuZahl(wert: Dezimalwert | null | undefined): number | null {
  if (wert === null || wert === undefined) return null;
  const zahl = typeof wert === "number" ? wert : Number(wert.toString());
  return Number.isFinite(zahl) ? zahl : null;
}

function prozentAnteil(wert: number): number {
  return Math.min(Math.max((wert / SKALA_MAX) * 100, 0), 100);
}

/** de-DE-Zahl ohne Einheit, fuer das `aria-label`, das "Prozent" ausschreibt. */
const VORLESE_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Textbeschreibung fuer das `aria-label`: ohne Sonderzeichen, gut vorlesbar. */
function beschreibe(name: string, min: number | null, max: number | null): string {
  const von = min ?? max;
  const bis = max ?? min;
  if (von === null || bis === null) return `${name} keine Angabe`;
  if (bis < 1) return `${name} unter ${VORLESE_FORMATTER.format(1)} Prozent`;
  if (von === bis) return `${name} ${VORLESE_FORMATTER.format(von)} Prozent`;
  return `${name} ${VORLESE_FORMATTER.format(von)} bis ${VORLESE_FORMATTER.format(bis)} Prozent`;
}

type ZeileProps = {
  name: string;
  min: number | null;
  max: number | null;
  balkenKlasse: string;
};

function Zeile({ name, min, max, balkenKlasse }: ZeileProps) {
  const von = min ?? max;
  const bis = max ?? min;
  const start = von === null ? 0 : prozentAnteil(von);
  const ende = bis === null ? 0 : prozentAnteil(bis);
  // Mindestbreite 1 %, damit ein Punktwert ueberhaupt sichtbar ist.
  const breite = Math.max(ende - start, von === null ? 0 : 1);

  return (
    <div className="flex items-center gap-4">
      <span className="w-8 shrink-0 text-caption tracking-wide text-text-muted">
        {name}
      </span>

      <span
        aria-hidden="true"
        className="flex h-2 grow overflow-hidden rounded-sm bg-surface-sunken"
      >
        <span
          className={cn("block h-full rounded-sm", balkenKlasse)}
          style={{ marginInlineStart: `${start}%`, width: `${breite}%` }}
        />
      </span>

      {/* Die Zahl steht immer daneben, der Balken ist nur Redundanz. */}
      <span className="numeric w-32 shrink-0 text-right text-small text-text">
        {von === null && bis === null
          ? "k. A."
          : bis !== null && bis < 1
            ? `< ${formatiereProzent(1)}`
            : formatiereProzentSpanne(von, bis)}
      </span>
    </div>
  );
}

/**
 * THC- und CBD-Spanne auf einer gemeinsamen 0-bis-35-%-Skala.
 * Kein Chart-Library-Import; die Balken sind zwei Divs mit Prozentbreite.
 */
export function CannabinoidBar({
  thcMin,
  thcMax,
  cbdMin,
  cbdMax,
  className,
}: CannabinoidBarProps) {
  const thcVon = zuZahl(thcMin);
  const thcBis = zuZahl(thcMax);
  const cbdVon = zuZahl(cbdMin);
  const cbdBis = zuZahl(cbdMax);

  const label = `${beschreibe("THC", thcVon, thcBis)}, ${beschreibe("CBD", cbdVon, cbdBis)}`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex flex-col gap-2", className)}
    >
      <Zeile name="THC" min={thcVon} max={thcBis} balkenKlasse="bg-text" />
      <Zeile name="CBD" min={cbdVon} max={cbdBis} balkenKlasse="bg-text-muted" />
      <p className="text-caption text-text-muted">Skala 0 bis 35&nbsp;% des Gewichts</p>
    </div>
  );
}
