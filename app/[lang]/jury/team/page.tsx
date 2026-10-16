import type { Metadata } from "next";
import Link from "next/link";

import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { Avatar, EmptyState, namenLinkKlassen } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { profilHref } from "@/lib/kurz-id";
import { ladeJuryTeam } from "@/lib/query/jury";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.jury.teamTitel, description: w.jury.teamSatz };
}

export default async function JuryTeamPage() {
  const [w, sprache, team] = await Promise.all([holeWoerterbuch(), holeSprache(), ladeJuryTeam()]);
  const j = w.jury;
  return (
    <JuryRahmen texte={j}>
      <header className="flex flex-col gap-4 max-md:text-center">
        <p>
          <Link prefetch={false} href="/jury" className={einzelLinkKlassen()}>
            {j.zurJury}
          </Link>
        </p>
        <h1 className="font-buch text-kapitel text-balance text-text">{j.teamTitel}</h1>
        <p className="max-w-[56ch] text-body text-pretty text-text-muted max-md:mx-auto">{j.teamSatz}</p>
      </header>
      {team.length > 0 ? (
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <li key={m.id} className="flex items-center gap-6 border border-border bg-surface-raised p-6">
              <Avatar name={m.name} bildId={m.avatarId} groesse="lg" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-buch text-h3 font-medium text-text wrap-break-word">
                  {m.kurzId ? (
                    <Link prefetch={false} href={profilHref(m.kurzId)} className={namenLinkKlassen()}>
                      {m.name}
                    </Link>
                  ) : (
                    m.name
                  )}
                </p>
                <p className="text-small text-text-muted">{mehrzahl(sprache, j.beitraege, m.beitraege)}</p>
                {m.instagram ? <p className="text-small text-text-muted wrap-break-word">{t(j.autor.instagram, { name: m.instagram })}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState titel={j.teamLeer} />
      )}
    </JuryRahmen>
  );
}
