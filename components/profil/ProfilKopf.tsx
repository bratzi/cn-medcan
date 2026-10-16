import Link from "next/link";
import type { ReactNode } from "react";

import { Randnotizen, type Randnotiz } from "@/components/kapitel/Randnotizen";
import { Avatar, Badge, buttonKlassen } from "@/components/ui";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Eine beschriftete Zahlengruppe im Profilkopf (Bewertungen, Mitbestimmung). */
export type ZahlenGruppe = { titel: string; notizen: readonly Randnotiz[] };

type Props = {
  name: string;
  avatarId: string | null;
  rolle: "betreiber" | "mitglied" | null;
  seit: Date | null;
  /** Leere Gruppen entfallen; das öffentliche Profil hat nur eine. */
  gruppen: readonly ZahlenGruppe[];
  aromen: readonly string[];
  aktionen: readonly { href: string; text: string; art: "primary" | "secondary" }[];
  texte: Woerterbuch["profil"]["seite"];
  sprache: Sprache;
  /** Öffentliches Profil: der Folgen-Knopf (Client-Insel) neben Rolle und Datum. */
  folgen?: ReactNode;
  /** Abzeichen „Terpz-Jury“ (Text); nur bei Jury-Mitgliedern gesetzt. */
  jury?: string;
};

const MONAT = {
  de: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
};

/**
 * Profilkopf (Spec Profil und Konto vereint 3.1, überarbeitet 2026-10-14: wirkte unsortiert): drei Zonen
 * an gemeinsamen Kanten. Links die Identität, in der Mitte die Zahlen in zwei beschrifteten Gruppen zu
 * je vier (Bewertungen | Mitbestimmung, getrennt durch eine Linie), rechts die Aktionen. Klebt ab
 * 1080 px unter dem Seitenkopf; von 1080 bis 1279 px stehen die Zahlen in einer zweiten Reihe.
 */
export function ProfilKopf({ name, avatarId, rolle, seit, gruppen, aromen, aktionen, texte, sprache, folgen, jury }: Props) {
  const datum = seit ? MONAT[sprache].format(seit) : null;
  const sichtbar = gruppen.filter((g) => g.notizen.length > 0);
  return (
    <div data-profil-kopf="" className="z-30 border-b border-border bg-surface min-[1080px]:sticky min-[1080px]:top-[var(--kopf-h,4rem)]">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-x-12 gap-y-6 px-4 py-6 sm:px-8 min-[1080px]:grid-cols-[minmax(0,1fr)_auto] min-[1280px]:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} bildId={avatarId} groesse="kopf" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-buch text-h2 font-normal text-text text-balance wrap-break-word">{name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {rolle ? <Badge variante={rolle === "betreiber" ? "accent" : "neutral"}>{texte[rolle]}</Badge> : null}
              {jury ? <Badge variante="accent">{jury}</Badge> : null}
              {datum ? <span className="text-small text-text-muted">{t(texte.dabeiSeit, { datum })}</span> : null}
              {folgen}
            </div>
            {aromen.length > 0 ? (
              <ul aria-label={texte.aromen} className="flex flex-wrap gap-2">
                {aromen.map((a) => (
                  <li key={a}>
                    <Badge variante="neutral">{a}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        {sichtbar.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-6 min-[1080px]:col-span-2 min-[1080px]:row-start-2 min-[1280px]:col-span-1 min-[1280px]:col-start-2 min-[1280px]:row-start-1">
            {sichtbar.map((g, i) => (
              <div key={g.titel} className={`flex flex-col gap-2 ${i > 0 ? "border-l border-border pl-8" : ""}`}>
                <p aria-hidden="true" className="text-caption text-text-muted">
                  {g.titel}
                </p>
                <Randnotizen notizen={g.notizen} beschriftung={g.titel} leiste />
              </div>
            ))}
          </div>
        ) : null}
        {aktionen.length > 0 ? (
          <div className="flex flex-wrap gap-4 min-[1080px]:col-start-2 min-[1080px]:row-start-1 min-[1280px]:col-start-3 min-[1280px]:flex-col min-[1280px]:items-stretch min-[1280px]:gap-2">
            {aktionen.map((a) => (
              <Link key={a.href} prefetch={false} href={a.href} className={buttonKlassen(a.art, "md")}>
                {a.text}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
