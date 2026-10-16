import Link from "next/link";

import { Avatar, namenLinkKlassen } from "@/components/ui";
import { profilHref } from "@/lib/kurz-id";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Autor eines Beitrags: Avatar, Name (Link auf das öffentliche Profil, nur wenn es eines gibt) und
 * Instagram-Name. Der Avatar ist Dekoration; der Name steht daneben.
 */
export function AutorKasten({
  name,
  kurzId,
  avatarId,
  instagram,
  texte,
}: {
  name: string;
  kurzId: string | null;
  avatarId?: string | null;
  instagram?: string | null;
  texte: Woerterbuch["jury"];
}) {
  return (
    <aside aria-label={texte.autor.titel} className="flex items-center gap-4 border-t border-border pt-8">
      <Avatar name={name} bildId={avatarId} groesse="kopf" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-small text-text-muted">{texte.autor.titel}</p>
        <p className="font-buch text-h3 font-medium text-text wrap-break-word">
          {kurzId ? (
            <Link prefetch={false} href={profilHref(kurzId)} className={namenLinkKlassen()}>
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        {instagram ? <p className="text-small text-text-muted wrap-break-word">{t(texte.autor.instagram, { name: instagram })}</p> : null}
      </div>
    </aside>
  );
}
