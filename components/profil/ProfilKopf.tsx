import Link from "next/link";

import { Randnotizen, type Randnotiz } from "@/components/kapitel/Randnotizen";
import { Avatar, Badge, buttonKlassen } from "@/components/ui";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  name: string;
  avatarId: string | null;
  rolle: "betreiber" | "mitglied" | null;
  seit: Date | null;
  notizen: readonly Randnotiz[];
  aromen: readonly string[];
  aktionen: readonly { href: string; text: string; art: "primary" | "secondary" }[];
  texte: Woerterbuch["profil"]["seite"];
  sprache: Sprache;
  /** Beschriftung der Zahlenliste; ohne Angabe „Deine Zahlen“ (eigenes Profil). */
  zahlenLabel?: string;
};

const MONAT = {
  de: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
};

/**
 * Profilkopf (Spec Profil und Konto vereint 3.1): volle Breite, klebt ab 1080 px unter dem Seitenkopf.
 * Ab 1280 px eine Reihe (Identität, Zahlen, Aktionen), von 1080 bis 1279 px Identität und Aktionen
 * oben, Zahlen darunter; schmaler ein Kopfblock, der mitscrollt (auf dem Telefon wäre er zu hoch).
 */
export function ProfilKopf({ name, avatarId, rolle, seit, notizen, aromen, aktionen, texte, sprache, zahlenLabel }: Props) {
  const datum = seit ? MONAT[sprache].format(seit) : null;
  return (
    <div data-profil-kopf="" className="z-30 border-b border-border bg-surface min-[1080px]:sticky min-[1080px]:top-[var(--kopf-h,4rem)]">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-8 min-[1080px]:grid-cols-[minmax(0,1fr)_auto] min-[1280px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} bildId={avatarId} groesse="kopf" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-buch text-h2 font-normal text-text text-balance wrap-break-word">{name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {rolle ? <Badge variante={rolle === "betreiber" ? "accent" : "neutral"}>{texte[rolle]}</Badge> : null}
              {datum ? <span className="text-small text-text-muted">{t(texte.dabeiSeit, { datum })}</span> : null}
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
        </div>
        {notizen.length > 0 ? (
          <div className="min-w-0 min-[1080px]:col-span-2 min-[1080px]:row-start-2 min-[1280px]:col-span-1 min-[1280px]:col-start-2 min-[1280px]:row-start-1">
            <Randnotizen notizen={notizen} beschriftung={zahlenLabel ?? texte.zahlen} leiste />
          </div>
        ) : null}
        {aktionen.length > 0 ? (
          <div className="flex flex-wrap gap-4 min-[1080px]:col-start-2 min-[1080px]:row-start-1 min-[1280px]:col-start-3">
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
