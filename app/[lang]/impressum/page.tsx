import type { Metadata } from "next";
import Link from "next/link";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { istPlatzhalter, ladeRechtliches } from "@/lib/rechtliches";

/*
 * VORLAGE, vor dem öffentlichen Start rechtlich prüfen lassen.
 * Grundlage: § 5 DDG (Anbieterkennzeichnung) und § 18 Abs. 2 MStV
 * (Verantwortlicher für journalistisch-redaktionelle Inhalte, hier die
 * redaktionellen Bewertungen). Alle Betreiberdaten kommen zur Laufzeit aus
 * dem Secret IMPRESSUM_JSON (lib/rechtliches.ts); fehlende stehen dort als
 * sichtbarer Platzhalter.
 * Die Seite ist vom Passwort-Gate ausgenommen (proxy.ts), weil das
 * Impressum ohne Hürde erreichbar sein muss.
 */

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: false },
};

const ABSCHNITT = "font-buch text-h3 font-medium text-balance text-text";

/** Platzhalter fallen auf: Warnfläche statt Fließtext, damit keine Lücke als Angabe durchgeht. */
function Angabe({ wert }: { wert: string }) {
  return istPlatzhalter(wert) ? (
    <span className="bg-warning px-2 text-warning-fg wrap-break-word">{wert}</span>
  ) : (
    <>{wert}</>
  );
}

export default async function ImpressumPage() {
  // Rechtstexte gibt es nur auf Deutsch: lang="de" fuer Vorleseprogramme,
  // auf Englisch ein Hinweis davor (Review 2026-09-28, WCAG 3.1.2).
  const [sprache, w, rechtliches] = await Promise.all([holeSprache(), holeWoerterbuch(), ladeRechtliches()]);
  const { betreiber: b, verantwortlich } = rechtliches;
  return (
    <>
      {sprache === "en" ? (
        <p className={cn(seitenRahmen(), "pt-8 text-small text-text-muted")}>{w.rahmen.nurDeutsch}</p>
      ) : null}
      <div lang="de">
      <Seitenkopf titel="Impressum" satz="Angaben nach § 5 DDG und § 18 Abs. 2 MStV." />

      <div className={cn(seitenRahmen(), "pt-16 pb-24")}>
        <div className="flex max-w-[68ch] flex-col gap-12 text-body text-text">
          <section aria-labelledby="impressum-anbieter" className="flex flex-col gap-4">
            <h2 id="impressum-anbieter" className={ABSCHNITT}>
              Anbieter
            </h2>
            <address className="not-italic">
              <Angabe wert={b.name} />
              <br />
              {b.vertretung ? (
                <>
                  Vertreten durch: <Angabe wert={b.vertretung} />
                  <br />
                </>
              ) : null}
              <Angabe wert={b.strasse} />
              <br />
              <Angabe wert={b.ort} />
              <br />
              <Angabe wert={b.land} />
            </address>
          </section>

          <section aria-labelledby="impressum-kontakt" className="flex flex-col gap-4">
            <h2 id="impressum-kontakt" className={ABSCHNITT}>
              Kontakt
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-text-muted">E-Mail</dt>
              <dd>
                {istPlatzhalter(b.email) ? (
                  <Angabe wert={b.email} />
                ) : (
                  <a href={`mailto:${b.email}`} className={textLinkKlassen("wrap-break-word")}>
                    {b.email}
                  </a>
                )}
              </dd>
              <dt className="text-text-muted">Telefon</dt>
              <dd>
                {istPlatzhalter(b.telefon) ? (
                  <Angabe wert={b.telefon} />
                ) : (
                  <a href={`tel:${b.telefon.replace(/[^\d+]/g, "")}`} className={textLinkKlassen("wrap-break-word")}>
                    {b.telefon}
                  </a>
                )}
              </dd>
            </dl>
          </section>

          {b.register || b.ustId ? (
            <section aria-labelledby="impressum-register" className="flex flex-col gap-4">
              <h2 id="impressum-register" className={ABSCHNITT}>
                Register und Steuer
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {b.register ? (
                  <>
                    <dt className="text-text-muted">Register</dt>
                    <dd>
                      <Angabe wert={b.register} />
                    </dd>
                  </>
                ) : null}
                {b.ustId ? (
                  <>
                    <dt className="text-text-muted">USt-IdNr.</dt>
                    <dd>
                      <Angabe wert={b.ustId} />
                    </dd>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section aria-labelledby="impressum-redaktion" className="flex flex-col gap-4">
            <h2 id="impressum-redaktion" className={ABSCHNITT}>
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <address className="not-italic">
              <Angabe wert={verantwortlich.name} />
              <br />
              <Angabe wert={verantwortlich.anschrift} />
            </address>
          </section>

          <section aria-labelledby="impressum-hinweis" className="flex flex-col gap-4">
            <h2 id="impressum-hinweis" className={ABSCHNITT}>
              Hinweis zu den Inhalten
            </h2>
            <p className="text-pretty">
              Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
              Information und ersetzen keine medizinische oder pharmazeutische Beratung. Über diese
              Seite werden keine Arzneimittel abgegeben.
            </p>
            <p className="text-pretty">
              Wie wir mit deinen Daten umgehen, steht in der{" "}
              <Link href="/datenschutz" prefetch={false} className={textLinkKlassen()}>
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
      </div>
    </>
  );
}
