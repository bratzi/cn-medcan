import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { Badge, buttonKlassen, Card, CardBody, CardHeader, textLinkKlassen } from "@/components/ui";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";
import type { MitgliedRolle, VorschlagStatus } from "@/db/enums";

export const metadata: Metadata = {
  title: "Mein Konto",
  robots: { index: false, follow: false },
};

const ROLLEN_LABEL: Record<MitgliedRolle, string> = {
  MITGLIED: "Mitglied",
  FACHKREIS: "Fachkreis",
  ADMIN: "Betreiber",
};

const DATUM_KURZ = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

const STATUS_BADGE: Record<VorschlagStatus, { text: string; variante: "warning" | "success" | "danger" }> = {
  OFFEN: { text: "Wird geprüft", variante: "warning" },
  FREIGEGEBEN: { text: "Im Katalog", variante: "success" },
  ABGELEHNT: { text: "Abgelehnt", variante: "danger" },
};

export default async function MitgliedPage() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fmitglied");

  const [nachrichten, vorschlaege] = await Promise.all([
    benachrichtigungenLaden(mitglied.mitgliedId),
    eigeneVorschlaege(mitglied.mitgliedId),
  ]);
  const ungelesen = nachrichten.filter((n) => !n.gelesen).length;

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text">Mein Konto</h1>
          <p className="mt-2 text-body text-text-muted">{mitglied.email}</p>
        </div>
        <AbmeldeButton />
      </div>

      <section aria-labelledby="status-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="status-titel" className="text-h3 text-text">
              Status
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Zustand nie nur ueber Farbe: das Badge traegt Klartext und
                  einen Formmarker, daneben steht ein erklaerender Satz. */}
              {mitglied.freigegeben ? (
                <Badge variante="success">Freigegeben</Badge>
              ) : (
                <Badge variante="warning">Freigabe steht aus</Badge>
              )}
              <Badge variante="neutral" zeichen={false}>
                Rolle: {ROLLEN_LABEL[mitglied.rolle]}
              </Badge>
            </div>

            <p className="max-w-[68ch] text-body text-text-muted">
              {mitglied.freigegeben
                ? "Das Konto ist freigegeben. Damit bestehen Stimmrecht in Umfragen und Sicht auf die Preisangaben."
                : "Der Betreiber gibt Konten von Hand frei. Bis dahin sind Vorschläge und Abstimmungen gesperrt; der Katalog bleibt lesbar."}
            </p>

            {mitglied.freigegeben ? (
              // §10 HWG adressiert Fachkreise, also Angehoerige der
              // Heilberufe. Ein freigegebenes Mitglied ist das nicht - die
              // Preisanzeige ist eine Entscheidung des Betreibers und braucht
              // deshalb diesen Hinweis. Die Rolle FACHKREIS bleibt im
              // Datenmodell, damit die strengere Variante ohne
              // Schemaaenderung nachziehbar ist.
              <p className="max-w-[68ch] text-caption text-text-muted">
                Hinweis: Preisangaben richten sich nach § 10 Heilmittelwerbegesetz an
                Angehörige der Heilberufe. Sie dienen hier der Orientierung und sind
                keine Aufforderung zum Erwerb.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="nachrichten-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="nachrichten-titel" className="text-h3 text-text">
              Benachrichtigungen
            </h2>
          </CardHeader>
          <CardBody>
            {nachrichten.length === 0 ? (
              <p className="text-body text-text-muted">Noch nichts Neues.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {nachrichten.map((n) => (
                  <li key={n.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-small text-text-muted">
                      <span className="numeric">{DATUM_KURZ.format(n.erstelltAm)}</span>
                      {!n.gelesen ? <Badge variante="accent">Neu</Badge> : null}
                    </span>
                    {n.link ? (
                      <Link href={n.link} className={textLinkKlassen()}>
                        {n.text}
                      </Link>
                    ) : (
                      <span className="text-body text-text">{n.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <GelesenMarkieren ungelesen={ungelesen} />
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="vorschlaege-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="vorschlaege-titel" className="text-h3 text-text">
              Meine Vorschläge
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
            {vorschlaege.length === 0 ? (
              <p className="text-body text-text-muted">Du hast noch keine Blüte vorgeschlagen.</p>
            ) : (
              <ul className="flex w-full flex-col gap-4">
                {vorschlaege.map((v) => (
                  <li key={v.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      {v.strainSlug ? (
                        <Link href={`/produkte/${v.strainSlug}`} className={textLinkKlassen()}>
                          {v.handelsname}
                        </Link>
                      ) : (
                        <span className="text-body text-text wrap-break-word">{v.handelsname}</span>
                      )}
                      <Badge variante={STATUS_BADGE[v.status].variante}>{STATUS_BADGE[v.status].text}</Badge>
                    </span>
                    {v.status === "ABGELEHNT" && v.begruendung ? (
                      <span className="text-small text-text-muted">Grund: {v.begruendung}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/vorschlagen" className={buttonKlassen("secondary")}>
              Blüte vorschlagen
            </Link>
          </CardBody>
        </Card>
      </section>

      {/* Der einzige Einstieg zu /admin. Bewusst nicht in der Navigation:
          die muesste sonst auf jeder Seite die Sitzung lesen und waere
          durchgehend dynamisch. Diese Seite liest sie ohnehin. */}
      {mitglied.rolle === "ADMIN" ? (
        <section aria-labelledby="verwaltung-titel" className="mt-8">
          <Card>
            <CardHeader>
              <h2 id="verwaltung-titel" className="text-h3 text-text">
                Verwaltung
              </h2>
            </CardHeader>
            <CardBody className="flex flex-col items-start gap-4">
              <p className="max-w-[68ch] text-body text-text-muted">
                Mitglieder freigeben und Rollen vergeben.
              </p>
              <Link href="/admin" className={buttonKlassen("secondary")}>
                Zur Verwaltung
              </Link>
            </CardBody>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="profil-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="profil-titel" className="text-h3 text-text">
              Angaben
            </h2>
          </CardHeader>
          <CardBody>
            <ProfilFormular
              anzeigename={mitglied.anzeigename}
              instagramHandle={mitglied.instagramHandle}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
