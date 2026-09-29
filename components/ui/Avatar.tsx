import { NutzerBild } from "@/components/medien/Bild";
import { avatarFarbe, initialen } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export type AvatarGroesse = "sm" | "md" | "lg";

/** Feste Kantenlaengen im 8px-Raster: 32, 40 und 128 px (die Quelle ist 128 px). */
const GROESSE: Record<AvatarGroesse, { klasse: string; seite: number; schrift: string }> = {
  sm: { klasse: "size-8", seite: 32, schrift: "text-caption" },
  md: { klasse: "size-10", seite: 40, schrift: "text-small" },
  lg: { klasse: "size-32", seite: 128, schrift: "text-h1" },
};

type Props = {
  /** Anzeigename: liefert die Initialen ohne Bild. Der Name steht immer daneben. */
  name: string;
  /** Bild-Id (/api/bild/<id>); null oder fehlend ergibt den Initialen-Kreis. */
  bildId?: string | null;
  groesse?: AvatarGroesse;
  className?: string;
};

/**
 * Profilbild eines Mitglieds (T8, Nutzer 2026-09-29): rund, mit Bild aus D1
 * oder ein Kreis mit gedruckten Initialen in einer aus dem Namen abgeleiteten
 * Tokenfarbe. Dekoration neben dem Namen, daher fuer Screenreader stumm
 * (aria-hidden, leerer Alt-Text). Server- und Client-tauglich, ohne Zustand.
 */
export function Avatar({ name, bildId, groesse = "md", className }: Props) {
  const g = GROESSE[groesse];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-sans font-medium",
        g.klasse,
        bildId ? "bg-surface-sunken" : cn(avatarFarbe(name), g.schrift),
        className,
      )}
    >
      {bildId ? <NutzerBild id={bildId} seite={g.seite} className="size-full" /> : initialen(name)}
    </span>
  );
}
