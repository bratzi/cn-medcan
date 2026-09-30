import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { AvatarFormular } from "@/components/mitglied/AvatarFormular";
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { Avatar, Badge, buttonKlassen, Card, CardBody, CardHeader, textLinkKlassen } from "@/components/ui";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { begruendungText } from "@/lib/empfehlung-text";
import { holeWoerterbuch } from "@/lib/i18n";
import { aktuellesMitglied } from "@/lib/session";
import type { VorschlagStatus } from "@/db/enums";
import { benachrichtigungSatz } from "@/lib/benachrichtigung";
import { formatiereDatum } from "@/lib/format";
import { holeSprache } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).kopf.navigation.konto, robots: { index: false, follow: false } };
}

const STATUS_VARIANTE: Record<VorschlagStatus, "warning" | "success" | "danger"> = {
  OFFEN: "warning",
  FREIGEGEBEN: "success",
  ABGELEHNT: "danger",
};

export default async function MitgliedPage() {
  const mitglied = await aktuellesMitglied();
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.mitglied;
  if (!mitglied) redirect("/anmelden?weiter=%2Fmitglied");

  const [nachrichten, vorschlaege, empfehlungen] = await Promise.all([
    benachrichtigungenLaden(mitglied.mitgliedId),
    eigeneVorschlaege(mitglied.mitgliedId),
    ladeEmpfehlungen(mitglied.mitgliedId),
  ]);
  const ungelesen = nachrichten.filter((n) => !n.gelesen).map((n) => n.id);

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={mitglied.anzeigename} bildId={mitglied.avatarId} groesse="md" />
          <div>
            <h1 className="text-h1 text-text">{w.kopf.navigation.konto}</h1>
            <p className="mt-2 text-body text-text-muted">{mitglied.email}</p>
          </div>
        </div>
        <AbmeldeButton texte={w.auth.formular} />
      </div>

      <section aria-labelledby="status-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="status-titel" className="text-h3 text-text">
              {texte.status}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Zustand nie nur ueber Farbe: das Badge traegt Klartext und
                  einen Formmarker, daneben steht ein erklaerender Satz. */}
              {mitglied.freigegeben ? (
                <Badge variante="success">{texte.freigegeben}</Badge>
              ) : (
                <Badge variante="warning">{texte.freigabeAus}</Badge>
              )}
              <Badge variante="neutral" zeichen={false}>
                {t(texte.rolle, { rolle: texte.rollen[mitglied.rolle] })}
              </Badge>
            </div>

            <p className="max-w-[68ch] text-body text-text-muted">
              {mitglied.freigegeben
                ? texte.freigegebenText
                : texte.nichtFreigegebenText}
            </p>
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="nachrichten-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="nachrichten-titel" className="text-h3 text-text">
              {texte.benachrichtigungen}
            </h2>
          </CardHeader>
          <CardBody>
            {nachrichten.length === 0 ? (
              <p className="text-body text-text-muted">{texte.nichtsNeues}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {nachrichten.map((n) => (
                  <li key={n.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-small text-text-muted">
                      <span className="numeric">{formatiereDatum(n.erstelltAm, sprache)}</span>
                      {!n.gelesen ? <Badge variante="accent">{texte.neu}</Badge> : null}
                    </span>
                    {n.link ? (
                      <Link href={n.link} className={textLinkKlassen()}>
                        {benachrichtigungSatz(w.benachrichtigung, n)}
                      </Link>
                    ) : (
                      <span className="text-body text-text">{benachrichtigungSatz(w.benachrichtigung, n)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <GelesenMarkieren ids={ungelesen} />
          </CardBody>
        </Card>
      </section>

      {/* Vorberechnet beim Speichern einer Bewertung (T11): hier nur eine Abfrage. */}
      <section aria-labelledby="empfehlungen-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="empfehlungen-titel" className="text-h3 text-text">
              {w.empfehlung.mitgliedTitel}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
            {empfehlungen.length === 0 ? (
              <p className="max-w-[68ch] text-body text-text-muted">{w.empfehlung.leer}</p>
            ) : (
              <EmpfehlungsListe
                schmal
                className="w-full"
                eintraege={empfehlungen.map((e) => ({
                  slug: e.slug,
                  handelsname: e.handelsname,
                  begruendung: begruendungText(e, w, sprache),
                }))}
              />
            )}
            <p className="text-caption text-text-muted">{w.empfehlung.hinweis}</p>
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="vorschlaege-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="vorschlaege-titel" className="text-h3 text-text">
              {texte.meineVorschlaege}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
            {vorschlaege.length === 0 ? (
              <p className="text-body text-text-muted">{texte.keineVorschlaege}</p>
            ) : (
              <ul className="flex w-full flex-col gap-4">
                {vorschlaege.map((v) => (
                  <li key={v.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      {v.strainSlug ? (
                        <Link href={`/blueten/${v.strainSlug}`} className={textLinkKlassen()}>
                          {v.handelsname}
                        </Link>
                      ) : (
                        <span className="text-body text-text wrap-break-word">{v.handelsname}</span>
                      )}
                      <Badge variante={STATUS_VARIANTE[v.status]}>{texte.vorschlagStatus[v.status]}</Badge>
                    </span>
                    {v.status === "ABGELEHNT" && v.begruendung ? (
                      <span className="text-small text-text-muted">{t(texte.grund, { text: v.begruendung })}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/vorschlagen" className={buttonKlassen("secondary")}>
              {texte.vorschlagen}
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
                {texte.verwaltung}
              </h2>
            </CardHeader>
            <CardBody className="flex flex-col items-start gap-4">
              <p className="max-w-[68ch] text-body text-text-muted">
                {texte.verwaltungText}
              </p>
              <Link href="/admin" className={buttonKlassen("secondary")}>
                {texte.zurVerwaltung}
              </Link>
            </CardBody>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="avatar-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="avatar-titel" className="text-h3 text-text">
              {texte.avatar.titel}
            </h2>
          </CardHeader>
          <CardBody>
            <AvatarFormular
              name={mitglied.anzeigename}
              avatarId={mitglied.avatarId}
              texte={texte.avatar}
              meldungen={w.meldung}
            />
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="profil-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="profil-titel" className="text-h3 text-text">
              {texte.angaben}
            </h2>
          </CardHeader>
          <CardBody>
            <ProfilFormular
              anzeigename={mitglied.anzeigename}
              instagramHandle={mitglied.instagramHandle}
              texte={texte.profil}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
