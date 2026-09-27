import { cn } from "@/lib/cn";
import { formatiereProzent, formatiereProzentSpanne, formatiereZahl, type Dezimalwert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";

/** Obergrenze der Skala: reale Blueten liegen unterhalb von 35 % THC. */
const SKALA_MAX = 35;

export type CannabinoidBarProps = {
  thcMin?: Dezimalwert | null;
  thcMax?: Dezimalwert | null;
  cbdMin?: Dezimalwert | null;
  cbdMax?: Dezimalwert | null;
  w: Woerterbuch;
  sprache: Sprache;
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

/** Textbeschreibung fuer das `aria-label`: ohne Sonderzeichen, gut vorlesbar ("Prozent" ausgeschrieben). */
function beschreibe(
  texte: Woerterbuch["katalog"]["cannabinoide"],
  sprache: Sprache,
  name: string,
  min: number | null,
  max: number | null,
): string {
  const von = min ?? max;
  const bis = max ?? min;
  if (von === null || bis === null) return t(texte.keineAngabe, { name });
  if (bis < 1) return t(texte.unter, { name, wert: formatiereZahl(1, 1, sprache) });
  if (von === bis) return t(texte.wert, { name, wert: formatiereZahl(von, 1, sprache) });
  return t(texte.spanne, { name, von: formatiereZahl(von, 1, sprache), bis: formatiereZahl(bis, 1, sprache) });
}

type ZeileProps = {
  name: string;
  min: number | null;
  max: number | null;
  balkenKlasse: string;
  sprache: Sprache;
  keineAngabe: string;
};

function Zeile({ name, min, max, balkenKlasse, sprache, keineAngabe }: ZeileProps) {
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
          ? keineAngabe
          : bis !== null && bis < 1
            ? `< ${formatiereProzent(1, 1, sprache)}`
            : formatiereProzentSpanne(von, bis, 1, sprache)}
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
  w,
  sprache,
  className,
}: CannabinoidBarProps) {
  const thcVon = zuZahl(thcMin);
  const thcBis = zuZahl(thcMax);
  const cbdVon = zuZahl(cbdMin);
  const cbdBis = zuZahl(cbdMax);

  const texte = w.katalog.cannabinoide;
  const label = `${beschreibe(texte, sprache, "THC", thcVon, thcBis)}, ${beschreibe(texte, sprache, "CBD", cbdVon, cbdBis)}`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex flex-col gap-2", className)}
    >
      <Zeile name="THC" min={thcVon} max={thcBis} balkenKlasse="bg-text" sprache={sprache} keineAngabe={w.bluete.fakten.keineAngabe} />
      <Zeile name="CBD" min={cbdVon} max={cbdBis} balkenKlasse="bg-text-muted" sprache={sprache} keineAngabe={w.bluete.fakten.keineAngabe} />
      <p className="text-caption text-text-muted">{texte.skala}</p>
    </div>
  );
}
