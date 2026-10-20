import type { Metadata } from "next";
import Link from "next/link";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Badge, EmptyState, type BadgeVariante } from "@/components/ui";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { IN_ARBEIT, NEUIGKEITEN, type Art } from "@/lib/neuigkeiten/eintraege";
import { nachMonat } from "@/lib/neuigkeiten/gruppieren";

/**
 * Neuigkeiten (Spec 2026-10-20-neuigkeiten-design.md): liest nur lib/neuigkeiten,
 * keine Anfrage, kein D1. Eine neue Meldung kommt mit dem nächsten Build.
 */
export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.neu.titel, description: w.neu.metaBeschreibung };
}

const ART_VARIANTE: Record<Art, BadgeVariante> = { neu: "accent", besser: "success", behoben: "neutral" };

/** Handschrift-Überschrift wie auf /sotm: kurz, in Kopierstift. */
const HAND_TITEL = "font-hand text-notiz text-logo";

export default async function NeuPage() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const monate = nachMonat(NEUIGKEITEN);
  const monatsName = new Intl.DateTimeFormat(sprache, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <Seitenkopf titel={w.neu.titel} satz={w.neu.satz} />

      {IN_ARBEIT.length > 0 ? (
        <section aria-labelledby="in-arbeit" className={cn(seitenRahmen(), "pt-16")}>
          <h2 id="in-arbeit" className={HAND_TITEL}>
            {w.neu.inArbeit}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {IN_ARBEIT.map((eintrag) => (
              <li key={eintrag.id} className="rounded-md border border-dashed border-border-strong p-6">
                <p className="font-buch text-h3 font-medium text-balance text-text">{eintrag.titel[sprache]}</p>
                <p className="mt-2 text-body text-pretty text-text-muted">{eintrag.text[sprache]}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="meldungen" className={cn(seitenRahmen(), "pt-16 pb-24")}>
        <h2 id="meldungen" className={ABSCHNITT_TITEL}>
          {w.neu.meldungen}
        </h2>
        {monate.length === 0 ? (
          <EmptyState titel={w.neu.leer} />
        ) : (
          monate.map((gruppe) => (
            <div key={gruppe.monat} className="mt-12">
              <h3 className="text-caption font-medium uppercase tracking-wide text-text-muted">
                {monatsName.format(new Date(`${gruppe.monat}-01T00:00:00Z`))}
              </h3>
              <ol className="mt-4 divide-y divide-border border-y border-border">
                {gruppe.eintraege.map((eintrag) => (
                  <li key={eintrag.id} className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-8">
                    <time dateTime={eintrag.datum} className="numeric text-small text-text-muted">
                      {formatiereDatum(`${eintrag.datum}T12:00:00Z`, sprache)}
                    </time>
                    <article className="flex min-w-0 flex-col gap-2">
                      <div>
                        <Badge variante={ART_VARIANTE[eintrag.art]}>{w.neu.art[eintrag.art]}</Badge>
                      </div>
                      <h4 className="font-buch text-h2 font-medium text-balance text-text">{eintrag.titel[sprache]}</h4>
                      <p className="max-w-[65ch] text-body text-pretty text-text">{eintrag.text[sprache]}</p>
                      {eintrag.link ? (
                        <p>
                          <Link prefetch={false} href={eintrag.link} className={textLinkKlassen()}>
                            {w.neu.ansehen}
                          </Link>
                        </p>
                      ) : null}
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </section>
    </>
  );
}
