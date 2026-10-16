import Link from "next/link";
import { notFound } from "next/navigation";

import { BeitragKarte } from "@/components/jury/BeitragKarte";
import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { JuryBild } from "@/components/medien/Bild";
import { buttonKlassen, EmptyState } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { ladeJuryStart } from "@/lib/query/jury";

const RASTER = "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Das Magazin: Seite 1 mit dem Aufmacher der neuesten Ausgabe (Titelbild, Titel, Einleitung, ihre
 * Beitragskarten), darunter „Alle Beiträge“ chronologisch. Weitere Seiten tragen nur die Liste. Der
 * Seitenwechsel läuft über Pfade (/jury, /jury/seite/2), nicht über ?seite=, weil die Seiten
 * statisch gebaut werden und ein Suchparameter dort leer bliebe (wie /reviews/band/<n>).
 */
export async function JurySeite({ seite }: { seite: number }) {
  const [w, sprache, start] = await Promise.all([holeWoerterbuch(), holeSprache(), ladeJuryStart(seite)]);
  if (seite > start.seitenAnzahl) notFound();
  const j = w.jury;
  const aufmacher = seite === 1 ? start.aufmacher : null;
  const titelbild = aufmacher?.beitraege.find((b) => b.titelbild)?.titelbild ?? null;
  const leer = !aufmacher && start.beitraege.length === 0;

  return (
    <JuryRahmen texte={j}>
      <header className="flex flex-col gap-4 max-md:text-center">
        <h1 className="font-hand text-notiz text-logo text-balance">{j.titel}</h1>
        <p className="max-w-[56ch] text-body text-pretty text-text-muted max-md:mx-auto">{j.untertitel}</p>
        <nav aria-label={j.titel} className="flex flex-wrap gap-x-6 max-md:justify-center">
          <Link prefetch={false} href="/jury/favourites" className={einzelLinkKlassen()}>
            {j.favourites}
          </Link>
          <Link prefetch={false} href="/jury/team" className={einzelLinkKlassen()}>
            {j.team}
          </Link>
        </nav>
      </header>

      {leer ? <EmptyState titel={j.leer} /> : null}

      {aufmacher ? (
        <section aria-labelledby="jury-ausgabe" className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            {titelbild ? (
              <Link
                prefetch={false}
                href={`/jury/ausgabe/${aufmacher.slug}`}
                aria-label={`${j.kopfAusgabe}: ${aufmacher.titel}`}
                className="block aspect-4/5 w-full overflow-hidden border border-border bg-surface-sunken sm:aspect-square lg:col-span-7 lg:aspect-4/3"
              >
                <JuryBild
                  id={titelbild.id}
                  breite={titelbild.breite}
                  hoehe={titelbild.hoehe}
                  alt={titelbild.alt || aufmacher.titel}
                  prioritaet
                  className="block size-full object-contain"
                />
              </Link>
            ) : null}
            <div className={`flex flex-col gap-4 ${titelbild ? "lg:col-span-5" : "lg:col-span-12"}`}>
              {aufmacher.erscheintAm ? (
                <p className="font-sans text-caption uppercase tracking-wide text-text-muted">
                  {t(j.ausgabeVom, { datum: formatiereDatum(aufmacher.erscheintAm, sprache) })}
                </p>
              ) : null}
              <h2 id="jury-ausgabe" className="font-buch text-display text-balance text-text wrap-break-word">
                {aufmacher.titel}
              </h2>
              {aufmacher.einleitung ? (
                <p className="max-w-[56ch] text-body text-pretty text-text-muted">{aufmacher.einleitung}</p>
              ) : null}
              <p>
                <Link prefetch={false} href={`/jury/ausgabe/${aufmacher.slug}`} className={buttonKlassen("secondary", "md")}>
                  {j.zurAusgabe}
                </Link>
              </p>
            </div>
          </div>
          {aufmacher.beitraege.length > 0 ? (
            <ul className={RASTER}>
              {aufmacher.beitraege.map((karte) => (
                <li key={karte.slug}>
                  <BeitragKarte karte={karte} texte={j} sprache={sprache} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {start.beitraege.length > 0 ? (
        <section aria-labelledby="jury-alle" className="flex flex-col gap-8">
          <h2 id="jury-alle" className="font-buch text-h1 font-medium text-balance text-text">
            {j.alleBeitraege}
          </h2>
          <ul className={RASTER}>
            {start.beitraege.map((karte) => (
              <li key={karte.slug}>
                <BeitragKarte karte={karte} texte={j} sprache={sprache} />
              </li>
            ))}
          </ul>
          {start.seitenAnzahl > 1 ? (
            <nav aria-label={j.seiten.navigation} className="flex flex-wrap items-center gap-x-8 gap-y-2">
              {seite > 1 ? (
                <Link prefetch={false} href={seite === 2 ? "/jury" : `/jury/seite/${seite - 1}`} rel="prev" className={einzelLinkKlassen()}>
                  {j.seiten.zurueck}
                </Link>
              ) : null}
              <span className="numeric text-small text-text-muted">{t(j.seiten.seite, { seite, gesamt: start.seitenAnzahl })}</span>
              {seite < start.seitenAnzahl ? (
                <Link prefetch={false} href={`/jury/seite/${seite + 1}`} rel="next" className={einzelLinkKlassen()}>
                  {j.seiten.weiter}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      ) : null}
    </JuryRahmen>
  );
}
