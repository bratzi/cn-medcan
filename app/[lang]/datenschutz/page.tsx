import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { DATENSCHUTZ_STAND, HOSTING_GRUNDLAGE, istPlatzhalter, ladeRechtliches } from "@/lib/rechtliches";

/**
 * Statisch je Sprache, täglich neu (Spec 2026-10-01, statische Seiten, 4.3).
 * Eine Änderung an IMPRESSUM_JSON greift spätestens nach einem Tag, sofort mit
 * dem nächsten Push (neuer Build, neuer Cache).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

/*
 * VORLAGE, vor dem öffentlichen Start rechtlich prüfen lassen (Art. 13 DSGVO).
 *
 * Jede Aussage ist am Code geprüft (Stand dieser Datei):
 * - Hosting: wrangler.jsonc (Workers, Assets, Images, D1 mit
 *   `--jurisdiction eu`, observability.enabled = Workers Logs).
 * - Cookies: keine Passwortschranke mehr seit 2026-10-22 (cn_gate entfällt);
 *   app/api/sprache/route.ts (sprache, 1 Jahr); lib/auth.ts + better-auth/dist/cookies
 *   (session_token, 30 Tage, täglich verlängert, ohne cookieCache, also
 *   kein session_data-Cookie; Vorsatz __Secure- in Produktion).
 * - Sitzung speichert IP-Adresse und User-Agent: prisma/schema.prisma
 *   (Session.ipAddress, userAgent), gefüllt von better-auth.
 * - Browser-Speicher: lib/thema.ts (localStorage) und
 *   components/layout/konto-zaehler-speicher.ts (sessionStorage).
 * - Instagram: components/produkt/InstagramEmbed.tsx +
 *   ReelNachKlick.tsx, Zwei-Klick-Lösung: bis zum Klick auf „Reel von
 *   Instagram laden“ keine Anfrage an instagram.com, danach iframe mit
 *   referrerPolicy="no-referrer"; die Wahl wird nicht gespeichert; nur in
 *   BuchDoppelseite.tsx, nur wenn der Betreiber ein Reel verknüpft hat
 *   (app/blueten/[slug]/aktionen.ts).
 * - Schriften: next/font/google in app/layout.tsx (beim Build eingebettet,
 *   keine Anfrage an Google im Browser). Medien aus public/medien.
 * - Keine Analyse- oder Werbedienste im Code und in package.json.
 * - Profilbild: prisma/schema.prisma (NutzerAvatar, BLOB in D1, 128 x 128 WebP,
 *   höchstens 30 KB), app/mitglied/aktionen.ts (setzen und löschen nur für das
 *   eigene Mitglied), app/api/bild/[id]/route.ts (öffentlich abrufbar per
 *   Zufalls-ID); Cascade beim Löschen des Mitglieds.
 * - Budpics (Blütenbilder): prisma/schema.prisma (Budpic, BLOB in D1, WebP, lange
 *   Kante höchstens 1280 px, höchstens 150 KB), app/blueten/[slug]/budpic-aktionen.ts
 *   (nur freigegebene Mitglieder), app/admin/budpic-aktionen.ts (Freigabe, Ablehnung,
 *   Löschen nur Betreiber), app/api/bild/[id]/route.ts (nur freigegebene, öffentlich);
 *   Cascade beim Löschen des Mitglieds oder der Sorte.
 *   Bilder zur Bewertung: app/blueten/[slug]/bewertungsbild-aktionen.ts (review_id an
 *   budpics, Spec 2026-10-06).
 * - Profil: prisma/schema.prisma (NutzerProfil, Tabelle nutzer_profil, Aroma-Netz und
 *   Terpene aus den eigenen Bewertungen, Cascade beim Löschen des Mitglieds);
 *   app/[lang]/profil/page.tsx (privat, nur das eigene Mitglied). Öffentliches Profil:
 *   Mitglied.profilOeffentlich (Vorgabe aus) und kurzId (8 Zufallszeichen, lib/kurz-id.ts),
 *   gesetzt nur über profilSichtbarkeitSetzen in app/[lang]/mitglied/aktionen.ts für das
 *   eigene Mitglied; app/[lang]/profil/[kurzId]/page.tsx zeigt nur bei eingeschaltetem
 *   Profil Anzeigename, Profilbild, freigegebene Bewertungen und das Aroma-Netz aus
 *   nutzer_profil, sonst 404; Vorschläge und Auswertungen nie.
 * - Löschen: User -> Mitglied, Sitzungen, Konto per Cascade; Stimmen,
 *   Vorschläge, Blütenvorschläge, Benachrichtigungen per Cascade;
 *   Bewertungen per SetNull (bleiben ohne Autor). Kein Selbstlöschen im
 *   Code, deshalb Löschung auf Anfrage.
 * Ändert sich eine dieser Stellen, muss dieser Text mitgezogen werden.
 */

export const metadata: Metadata = {
  title: "Datenschutz",
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

function Abschnitt({ id, titel, children }: { id: string; titel: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className={ABSCHNITT}>
        {titel}
      </h2>
      {children}
    </section>
  );
}

type Speicher = { name: string; art: string; zweck: string; dauer: string };

const SPEICHER: Speicher[] = [
  {
    name: "better-auth.session_token",
    art: "Cookie, auf der Live-Seite mit dem Vorsatz __Secure-",
    zweck: "Hält dich nach der Anmeldung angemeldet. Wird nur gesetzt, wenn du dich anmeldest.",
    dauer: "30 Tage, verlängert sich bei Nutzung; endet mit dem Abmelden",
  },
  {
    name: "sprache",
    art: "Cookie",
    zweck: "Merkt sich, ob du die Seite auf Deutsch oder Englisch sehen willst. Wird nur gesetzt, wenn du die Sprache umschaltest.",
    dauer: "1 Jahr",
  },
  {
    name: "gruenes-buch-thema",
    art: "localStorage",
    zweck: "Merkt sich, ob du die helle oder dunkle Ansicht gewählt hast. Bleibt in deinem Browser.",
    dauer: "Bis du den Speicher deines Browsers leerst",
  },
  {
    name: "benachrichtigungen-ungelesen",
    art: "sessionStorage",
    zweck: "Zwischenspeicher für die Zahl ungelesener Nachrichten, deinen Anzeigenamen und die Kennung deines Profilbilds an der Kontopille.",
    dauer: "Höchstens bis du den Tab schließt",
  },
];

export default async function DatenschutzPage() {
  // Rechtstexte gibt es nur auf Deutsch: lang="de" fuer Vorleseprogramme,
  // auf Englisch ein Hinweis davor (Review 2026-09-28, WCAG 3.1.2).
  const [sprache, w, rechtliches] = await Promise.all([holeSprache(), holeWoerterbuch(), ladeRechtliches()]);
  const { betreiber: b, aufsicht } = rechtliches;
  return (
    <>
      {sprache === "en" ? (
        <p className={cn(seitenRahmen(), "pt-8 text-small text-text-muted")}>{w.rahmen.nurDeutsch}</p>
      ) : null}
      <div lang="de">
      <Seitenkopf
        titel="Datenschutz"
        satz="Welche Daten wir verarbeiten, wofür und wie lange. Kurz gesagt: nur, was die Seite zum Funktionieren braucht, keine Analyse, keine Werbung. Lesen geht ohne Konto."
      />

      <div className={cn(seitenRahmen(), "pt-16 pb-24")}>
        <div className="flex max-w-[68ch] flex-col gap-12 text-body text-text">
          <Abschnitt id="ds-verantwortlich" titel="Verantwortlich">
            <address className="not-italic">
              <Angabe wert={b.name} />
              <br />
              <Angabe wert={b.strasse} />
              <br />
              <Angabe wert={b.ort} />
              <br />
              <Angabe wert={b.land} />
              <br />
              E-Mail:{" "}
              {istPlatzhalter(b.email) ? (
                <Angabe wert={b.email} />
              ) : (
                <a href={`mailto:${b.email}`} className={textLinkKlassen("wrap-break-word")}>
                  {b.email}
                </a>
              )}
            </address>
            <p className="text-pretty">
              Alle weiteren Angaben stehen im{" "}
              <Link href="/impressum" prefetch={false} className={textLinkKlassen()}>
                Impressum
              </Link>
              . Für jede Frage zum Datenschutz schreib uns an diese Adresse.
            </p>
          </Abschnitt>

          <Abschnitt id="ds-gesundheit" titel="Bitte keine Gesundheitsdaten">
            <p className="border-l-2 border-border-strong pl-4 text-pretty">
              Wir fragen nie nach Diagnosen, Rezepten oder Beschwerden. Schreib solche Angaben bitte
              auch nicht in Notizen, Begründungen oder deinen Anzeigenamen. Freigegebene Bewertungen
              und Vorschläge sehen andere Besucherinnen und Besucher mit deinem Anzeigenamen.
            </p>
          </Abschnitt>

          <Abschnitt id="ds-hosting" titel="Hosting und Zugriffsdaten">
            <p className="text-pretty">
              Die Seite läuft bei Cloudflare, Inc. (Cloudflare Workers). Bei jedem Aufruf verarbeitet
              Cloudflare technisch notwendige Daten: deine IP-Adresse, Zeitpunkt, aufgerufene Adresse,
              Browserkennung und Statuscode. Für die Fehlersuche sind Aufrufprotokolle (Workers Logs)
              eingeschaltet; Cloudflare löscht sie nach der im Tarif festgelegten Frist.
            </p>
            <p className="text-pretty">
              Die Datenbank (Cloudflare D1) ist auf die EU festgelegt, deine Kontodaten liegen dort.
              Die Auslieferung selbst läuft über das weltweite Netz von Cloudflare. Bilder und
              Videos kommen von unserem eigenen Server.
            </p>
            <p className="text-pretty">
              Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren, erreichbaren Seite
              (Art. 6 Abs. 1 lit. f DSGVO). {HOSTING_GRUNDLAGE}
            </p>
          </Abschnitt>

          <Abschnitt id="ds-konto" titel="Dein Konto">
            <p className="text-pretty">
              Für die Registrierung speichern wir Anzeigename, E-Mail-Adresse und dein Passwort, das
              nur als Hash abgelegt wird, nie im Klartext. Den Instagram-Namen gibst du freiwillig
              an; ihn sehen nur wir, etwa bei der Freigabe deines Kontos. Zum Konto gehören außerdem
              Rolle, Freigabestatus und die Nachrichten, die wir dir im Konto anzeigen.
            </p>
            <p className="text-pretty">
              Solange du angemeldet bist, speichern wir zu deiner Sitzung IP-Adresse und
              Browserkennung. Wir versenden keine E-Mails. Lesen kann jede und jeder ohne Konto;
              nach der Registrierung prüfen wir dein Konto und geben es von Hand frei. Erst dann kannst
              du bewerten, kommentieren, Bilder beitragen und abstimmen. Die Angaben bei der
              Registrierung brauchen wir für die Mitgliedschaft; ohne sie können wir kein Konto
              anlegen.
            </p>
            <p className="text-pretty">
              Ein Profilbild ist freiwillig. Dein Browser schneidet es auf 128 × 128 Punkte zu und
              verkleinert es, bevor es hochgeladen wird. Wir speichern nur dieses kleine Bild, nie
              das Original, in unserer Datenbank (Cloudflare D1, EU). Es erscheint neben deinem
              Anzeigenamen bei Bewertungen und Vorschlägen und ist über seine Adresse abrufbar.
              Ohne Bild zeigen wir deine Initialen. Du kannst es jederzeit unter „Mein Profil“ im Reiter „Konto“
              austauschen oder entfernen; dann wird es gelöscht. Beim Löschen deines Kontos
              verschwindet es mit.
            </p>
            <p className="text-pretty">
              Freigeschaltete Mitglieder können Bilder von Blüten beitragen („Budpics“). Dein
              Browser verkleinert jedes Bild auf höchstens 1280 Pixel und 150 KB, bevor es
              hochgeladen wird; wir speichern nur dieses Bild, nie das Original, in unserer
              Datenbank (Cloudflare D1, EU), zusammen mit deinem Konto und dem Datum. Ein neues
              Bild ist zunächst nur für uns sichtbar. Erst nach unserer Freigabe erscheint es bei
              der Blüte, mit deinem Anzeigenamen und dem Datum, und ist über seine Adresse
              abrufbar. Bilder, die du zu deiner Bewertung hochlädst, speichern wir genauso; nach
              der Freigabe erscheinen sie bei deiner Bewertung und in den Bildern der Blüte. Löschst
              du ein solches Bild oder verwerfen wir die Bewertung, verschwindet es an beiden
              Stellen. Beim Verkleinern im Browser fallen eingebettete Angaben wie der Aufnahmeort
              weg. Für beide Arten von Bildern, Budpics und Bilder zu deiner Bewertung, gilt: Wir
              können Bilder ablehnen oder löschen. Beim Löschen deines Kontos verschwinden auch
              deine Bilder. Achte darauf, dass auf dem Bild keine Personen und
              keine persönlichen Angaben zu sehen sind.
            </p>
            <p className="text-pretty">
              Freigeschaltete Mitglieder können Bewertungen und öffentliche Profile kommentieren. Wir
              speichern den Text (höchstens 1000 Zeichen) zusammen mit deinem Konto und dem Datum in
              unserer Datenbank (Cloudflare D1, EU); er erscheint mit deinem Anzeigenamen. Du kannst
              eigene Kommentare jederzeit löschen, ebenso der Inhaber der Bewertung oder des Profils.
              Jedes freigeschaltete Mitglied kann einen Kommentar melden, optional mit einem Grund;
              gemeldete Kommentare prüfen wir und löschen sie bei Verstößen. Gelöschte Kommentare sind
              sofort unsichtbar; den Text entfernen wir endgültig beim nächsten Aufräumlauf,
              frühestens 30 Tage nach dem Schreiben. Beim Löschen deines Kontos verschwinden auch
              deine Kommentare.
            </p>
            <p className="text-pretty">
              Freigeschaltete Mitglieder können Bewertungen und Blüten liken und anderen Mitgliedern
              folgen. Wir speichern, welches Mitglied was geliket hat oder wem es folgt, mit dem
              Datum. Die Zahl der Likes ist öffentlich. Das betroffene Mitglied oder der Autor der
              Bewertung erhält eine Nachricht mit deinem Anzeigenamen. In öffentlichen Profilen
              zeigen die Listen nur Mitglieder mit öffentlichem Profil. Ein Like oder Folgen
              verschwindet, wenn du es zurücknimmst oder dein Konto löschst.
            </p>
            <p className="text-pretty">
              Rechtsgrundlage ist die Mitgliedschaft, die du mit der Registrierung eingehst (Art. 6
              Abs. 1 lit. b DSGVO), beim Profilbild, bei Budpics und bei Bildern zu deiner Bewertung
              deine Einwilligung durch das Hochladen (Art. 6 Abs. 1 lit. a DSGVO).
            </p>
          </Abschnitt>

          <Abschnitt id="ds-beitraege" titel="Bewertungen, Stimmen und Vorschläge">
            <p className="text-pretty">
              Bewertungen speichern wir mit deinen Noten, Angaben und Notizen. Öffentlich sichtbar
              werden sie erst nach unserer Freigabe, zusammen mit deinem Anzeigenamen.
            </p>
            <p className="text-pretty">
              Aus deinen Bewertungen berechnen wir dein Profil: ein Aroma-Netz, deine Terpene,
              Vorschläge mit ähnlichem Aroma und Auswertungen wie deine Schnitte. Das sehen nur du
              und, technisch bedingt, wir. Schaltest du unter „Mein Profil“ im Reiter „Konto“ dein
              öffentliches Profil ein, sehen alle unter einer zufälligen Adresse deinen
              Anzeigenamen, dein Profilbild, die Zahl und Liste deiner freigegebenen Bewertungen
              und ein Aroma-Netz nur aus diesen freigegebenen Bewertungen; dein Name bei Bewertungen
              verweist dann dorthin. Einschalten lässt es sich, sobald dein Konto freigegeben ist.
              Vorschläge und Auswertungen bleiben privat. Das öffentliche Profil ist anfangs aus, du
              kannst es jederzeit wieder ausschalten; die Adresse führt dann sofort ins Leere, der
              Verweis bei deinem Namen verschwindet nach wenigen Minuten. Rechtsgrundlage ist
              deine Einwilligung durch das Einschalten (Art. 6 Abs. 1 lit. a DSGVO).
            </p>
            <p className="text-pretty">
              Deine Stimme in einer Abstimmung speichern wir mit deinem Konto, damit jedes Mitglied
              genau einmal abstimmt. Angezeigt werden nur die Summen, nie wer wofür gestimmt hat.
            </p>
            <p className="text-pretty">
              Vorschläge für eine Abstimmungsrunde erscheinen mit Anzeigename und Begründung auf der
              Abstimmungsseite. Vorschläge für eine fehlende Blüte sehen nur wir.
            </p>
          </Abschnitt>

          <Abschnitt id="ds-speicher" titel="Cookies und Speicher im Browser">
            <p className="text-pretty">
              Wir setzen nur, was für die Seite unbedingt nötig ist oder was du selbst auswählst
              (§ 25 Abs. 2 Nr. 2 TDDDG). Tracking-Cookies setzen wir nicht.
            </p>
            <ul className="flex flex-col gap-6">
              {SPEICHER.map((s) => (
                <li key={s.name} className="border-l-2 border-border pl-4">
                  <p className="font-medium wrap-break-word">{s.name}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-small">
                    <dt className="text-text-muted">Art</dt>
                    <dd>{s.art}</dd>
                    <dt className="text-text-muted">Zweck</dt>
                    <dd className="text-pretty">{s.zweck}</dd>
                    <dt className="text-text-muted">Dauer</dt>
                    <dd>{s.dauer}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          </Abschnitt>

          <Abschnitt id="ds-instagram" titel="Instagram-Videos">
            <p className="text-pretty">
              Zu manchen unserer eigenen Bewertungen gibt es ein Video von Instagram. Wir binden es
              erst ein, wenn du auf „Reel von Instagram laden“ klickst. Bis dahin lädt dein Browser
              nichts von Instagram, und Meta erfährt nichts von deinem Besuch.
            </p>
            <p className="text-pretty">
              Nach dem Klick lädt dein Browser das Video direkt von Instagram. Dabei erhält Meta
              Platforms Ireland Limited deine IP-Adresse und Angaben zu deinem Browser und kann
              eigene Cookies lesen oder setzen, vor allem wenn du bei Instagram angemeldet bist.
              Unsere Seitenadresse geben wir dabei nicht mit. Deine Wahl speichern wir nicht; beim
              nächsten Besuch fragen wir wieder.
            </p>
            <p className="text-pretty">
              Rechtsgrundlage ist deine Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO,
              § 25 Abs. 1 TDDDG). Du kannst sie jederzeit widerrufen, indem du die Seite neu lädst;
              dann ist das Video wieder ausgeblendet. Was Meta bereits erhalten hat, bleibt davon
              unberührt.
            </p>
            <p className="text-pretty">
              Was Meta mit diesen Daten macht, steht in der{" "}
              <a
                href="https://privacycenter.instagram.com/policy"
                rel="noopener noreferrer"
                className={textLinkKlassen()}
              >
                Datenschutzrichtlinie von Instagram
              </a>
              .
            </p>
          </Abschnitt>

          <Abschnitt id="ds-dienste" titel="Schriften und Analyse">
            <p className="text-pretty">
              Die Schriften liefern wir selbst aus; dein Browser fragt dafür nicht bei Google an. Wir
              nutzen keine Analyse-, Statistik- oder Werbedienste.
            </p>
          </Abschnitt>

          <Abschnitt id="ds-dauer" titel="Wie lange wir speichern">
            <p className="text-pretty">
              Kontodaten speichern wir, bis du dein Konto löschen lässt. Schreib uns dafür eine
              E-Mail. Mit dem Konto löschen wir Sitzungen, Stimmen, Vorschläge, Nachrichten,
              Kommentare sowie Likes und Folgen.
              Deine Bewertungen bleiben ohne deinen Namen erhalten.
            </p>
          </Abschnitt>

          <Abschnitt id="ds-empfaenger" titel="Empfänger und automatisierte Entscheidungen">
            <p className="text-pretty">
              Deine Daten verarbeitet in unserem Auftrag nur Cloudflare (Hosting und Datenbank, siehe
              oben). Wir verkaufen keine Daten und geben sie nicht an Dritte weiter, außer wir sind
              gesetzlich dazu verpflichtet. Über die Freigabe deines Kontos und deiner Beiträge
              entscheiden Menschen, nicht ein automatisiertes Verfahren (Art. 22 DSGVO).
            </p>
          </Abschnitt>

          <Abschnitt id="ds-rechte" titel="Deine Rechte">
            <p className="text-pretty">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
              und Datenübertragbarkeit (Art. 15 bis 20 DSGVO). Einer Verarbeitung auf Grundlage
              unseres berechtigten Interesses kannst du widersprechen (Art. 21 DSGVO). Eine
              Einwilligung kannst du jederzeit für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO), etwa
              indem du ein Bild löschst oder dein öffentliches Profil ausschaltest; was bis dahin
              geschah, bleibt rechtmäßig. Schreib uns dafür an die oben genannte Adresse.
            </p>
            <p className="text-pretty">
              Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77
              DSGVO). Für uns zuständig ist:{" "}
              {aufsicht.url ? (
                <a href={aufsicht.url} rel="noopener noreferrer" className={textLinkKlassen("wrap-break-word")}>
                  {aufsicht.name}
                </a>
              ) : (
                <Angabe wert={aufsicht.name} />
              )}
            </p>
          </Abschnitt>

          <p className="text-small text-text-muted">
            Stand: {DATENSCHUTZ_STAND}
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
