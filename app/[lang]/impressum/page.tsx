import type { Metadata } from "next";
import Link from "next/link";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { istPlatzhalter, ladeRechtliches } from "@/lib/rechtliches";

/**
 * Statisch je Sprache, täglich neu (Spec 2026-10-01, statische Seiten, 4.3).
 * Eine Änderung an IMPRESSUM_JSON greift spätestens nach einem Tag, sofort mit
 * dem nächsten Push (neuer Build, neuer Cache).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

/*
 * VORLAGE, vor dem öffentlichen Start rechtlich prüfen lassen.
 * Grundlage: § 5 DDG (Anbieterkennzeichnung) und § 18 Abs. 2 MStV
 * (Verantwortlicher für journalistisch-redaktionelle Inhalte, hier die
 * redaktionellen Bewertungen). Alle Betreiberdaten kommen zur Laufzeit aus
 * dem Secret IMPRESSUM_JSON (lib/rechtliches.ts); fehlende stehen dort als
 * sichtbarer Platzhalter.
 * Seit 2026-10-22 ist die ganze Seite öffentlich (keine Passwortschranke mehr).
 * Kontakt nur per E-Mail, keine Telefonnummer (Nutzer 2026-10-21 und 2026-10-22).
 * Nutzerbeiträge (Bewertungen, Kommentare, Bilder) machen die Seite zum Hostingdienst:
 * Kontaktstelle und Meldeweg nach Art. 11, 12 und 16 DSA stehen deshalb hier.
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

          <section aria-labelledby="impressum-dsa" className="flex flex-col gap-4">
            <h2 id="impressum-dsa" className={ABSCHNITT}>
              Kontaktstelle und Meldung rechtswidriger Inhalte
            </h2>
            <p className="text-pretty">
              Zentrale Kontaktstelle für Behörden, die EU-Kommission und Nutzerinnen und Nutzer nach
              Art. 11 und 12 der Verordnung (EU) 2022/2065 (Digital Services Act) ist die oben genannte
              E-Mail-Adresse. Du kannst uns auf Deutsch oder Englisch schreiben.
            </p>
            <p className="text-pretty">
              Bewertungen, Kommentare und Bilder stammen zum Teil von Mitgliedern. Hältst du einen
              Inhalt für rechtswidrig, schreib uns an dieselbe Adresse (Art. 16 DSA). Nenne bitte die
              genaue Adresse der Seite, beschreibe den Inhalt und warum er aus deiner Sicht rechtswidrig
              ist, und gib deinen Namen und deine E-Mail-Adresse an. Kommentare kannst du als Mitglied
              auch direkt am Kommentar melden. Wir prüfen jede Meldung zügig, entfernen rechtswidrige
              Inhalte und sagen dir, wie wir entschieden haben.
            </p>
          </section>

          <section aria-labelledby="impressum-haftung" className="flex flex-col gap-4">
            <h2 id="impressum-haftung" className={ABSCHNITT}>
              Haftung für Inhalte und Links
            </h2>
            <p className="text-pretty">
              Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich. Für Beiträge von
              Mitgliedern haften wir nach §§ 7 bis 10 DDG erst, wenn wir von einer Rechtsverletzung
              wissen; dann entfernen wir den Inhalt umgehend. Neue Bewertungen und Bilder von Mitgliedern
              erscheinen erst nach unserer Freigabe.
            </p>
            <p className="text-pretty">
              Für die Inhalte verlinkter fremder Seiten ist allein deren Anbieter verantwortlich. Beim
              Setzen eines Links haben wir keine Rechtsverstöße erkannt; erfahren wir von einem, entfernen
              wir den Link.
            </p>
          </section>

          <section aria-labelledby="impressum-urheber" className="flex flex-col gap-4">
            <h2 id="impressum-urheber" className={ABSCHNITT}>
              Urheberrecht
            </h2>
            <p className="text-pretty">
              Texte, Bilder und Gestaltung dieser Seite unterliegen dem deutschen Urheberrecht. Bilder von
              Mitgliedern gehören den Mitgliedern; mit dem Hochladen räumen sie uns das Recht ein, sie hier
              zu zeigen. Herstellerlogos und Produktnamen gehören ihren Inhabern und dienen nur der
              Zuordnung.
            </p>
          </section>

          <section aria-labelledby="impressum-streit" className="flex flex-col gap-4">
            <h2 id="impressum-streit" className={ABSCHNITT}>
              Verbraucherstreitbeilegung
            </h2>
            <p className="text-pretty">
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
            </p>
          </section>

          <section aria-labelledby="impressum-hinweis" className="flex flex-col gap-4">
            <h2 id="impressum-hinweis" className={ABSCHNITT}>
              Hinweis zu den Inhalten
            </h2>
            <p className="text-pretty">
              Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
              Information und ersetzen keine medizinische oder pharmazeutische Beratung. Über diese
              Seite werden keine Arzneimittel abgegeben, beworben oder vermittelt. Bewertungen geben
              persönliche Erfahrungen wieder, keine Empfehlung und kein Heilversprechen.
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
