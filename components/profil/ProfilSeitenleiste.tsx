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
 * Identität des Profils (Spec Profil Desktop 2026-10-13): ab 1080 px eine feste Spalte links,
 * darunter ein Kopfblock. Kein Hintergrundwort, keine Freisteller-Blüte.
 */
export function ProfilSeitenleiste({ name, avatarId, rolle, seit, notizen, aromen, aktionen, texte, sprache, zahlenLabel }: Props) {
  const datum = seit ? MONAT[sprache].format(seit) : null;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-6 min-[1080px]:flex-col min-[1080px]:items-start">
        <Avatar name={name} bildId={avatarId} groesse="lg" className="max-[1079px]:size-24 shrink-0" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-buch text-h1 font-normal text-text text-balance wrap-break-word">{name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {rolle ? <Badge variante={rolle === "betreiber" ? "accent" : "neutral"}>{texte[rolle]}</Badge> : null}
            {datum ? <span className="text-small text-text-muted">{t(texte.dabeiSeit, { datum })}</span> : null}
          </div>
        </div>
      </div>
      {notizen.length > 0 ? <Randnotizen notizen={notizen} beschriftung={zahlenLabel ?? texte.zahlen} kompakt /> : null}
      {aromen.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-small text-text-muted">{texte.aromen}</p>
          <ul className="flex flex-wrap gap-2">
            {aromen.map((a) => (
              <li key={a}>
                <Badge variante="neutral">{a}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {aktionen.length > 0 ? (
        <div className="flex flex-wrap gap-4 min-[1080px]:flex-col min-[1080px]:items-stretch">
          {aktionen.map((a) => (
            <Link key={a.href} prefetch={false} href={a.href} className={buttonKlassen(a.art, "md")}>
              {a.text}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
