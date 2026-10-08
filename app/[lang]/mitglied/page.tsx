import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache, Suspense, ViewTransition } from "react";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Kapitelkopf } from "@/components/kapitel/Kapitelkopf";
import { KapitelRaster } from "@/components/kapitel/KapitelRaster";
import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { Bild } from "@/components/medien/Bild";
import { AvatarFormular } from "@/components/mitglied/AvatarFormular";
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { MeineStimmen } from "@/components/mitglied/MeineStimmen";
import { ProfilSichtbarkeit } from "@/components/mitglied/ProfilSichtbarkeit";
import { UmfrageJetzt } from "@/components/mitglied/UmfrageJetzt";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { Badge, buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { VorschlagStatus } from "@/db/enums";
import { benachrichtigungSatz } from "@/lib/benachrichtigung";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { musterBildId } from "@/lib/budpics";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { kontoNotizen } from "@/lib/konto";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { ladeStimmen, stimmZahlen } from "@/lib/query/konto";
import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).profil.reiterKonto, robots: { index: false, follow: false } };
}

const STATUS_VARIANTE: Record<VorschlagStatus, "warning" | "success" | "danger"> = {
  OFFEN: "warning",
  FREIGEGEBEN: "success",
  ABGELEHNT: "danger",
};

/** Fehler eines Teils reißen die Seite nicht mit; Redirects gehen durch. */
function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

// Je Aufruf eine Abfrage je Quelle, auch wenn mehrere Felder sie lesen (Spec 9).
const textLaden = cache(async () => {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return { w, sprache };
});
const nachrichtenLaden = cache((id: string) =>
  benachrichtigungenLaden(id).catch(oderNull<Awaited<ReturnType<typeof benachrichtigungenLaden>>>("benachrichtigungenLaden")),
);
const vorschlaegeLaden = cache((id: string) =>
  eigeneVorschlaege(id).catch(oderNull<Awaited<ReturnType<typeof eigeneVorschlaege>>>("eigeneVorschlaege")),
);
const stimmenLaden = cache((id: string) => ladeStimmen(id).catch(oderNull<Awaited<ReturnType<typeof ladeStimmen>>>("ladeStimmen")));
const umfrageLaden = cache(() => aktiveUmfrage().catch(oderNull<Awaited<ReturnType<typeof aktiveUmfrage>>>("aktiveUmfrage")));

/**
 * Dein Kapitel, Reiter Konto (Spec Profil und Konto 5, 7): oben dein Konto
 * (Angaben, Avatar, Sichtbarkeit, Status, Nachrichten), darunter, was du
 * mitbestimmst (Umfrage, Vorschläge, Stimmen). Seit Spec Profil 6 ist diese Seite der Reiter Konto von
 * /profil; die Empfehlungen stehen dort als bestätigte Vorschläge.
 */
export default async function MitgliedPage() {
  const mitglied = await aktuellesMitglied();
  const { w } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fmitglied");
  const texte = w.mitglied;
  const id = mitglied.mitgliedId;

  return (
    <KapitelRaster>
      <ViewTransition name="kapitel-kopf">
        <Kapitelkopf
          name={mitglied.anzeigename}
          avatarId={mitglied.avatarId}
          schlagwort={texte.kapitel.schlagwort}
          ton="lila"
          aktion={<AbmeldeButton texte={w.auth.formular} />}
          bild={
            <Suspense fallback={null}>
              <KopfBild id={id} />
            </Suspense>
          }
          reiter={<ProfilReiter aktiv="konto" texte={w.profil} />}
        />
      </ViewTransition>
      <Suspense fallback={<FeldSkelett spalten={10} hoehe="klein" />}>
        <ViewTransition>
          <Notizen id={id} dabeiSeit={mitglied.erstelltAm} />
        </ViewTransition>
      </Suspense>
      {/* Reihenfolge (Nutzer 2026-10-08): erst, was dein Konto ausmacht (Angaben,
          Avatar, Sichtbarkeit, Status, Nachrichten), danach die Umfrage und
          zuletzt der Rückblick auf deine Stimmen. */}
      <Feld id="angaben" spalten={4} titel={texte.angaben}>
        <ProfilFormular anzeigename={mitglied.anzeigename} instagramHandle={mitglied.instagramHandle} texte={texte.profil} />
      </Feld>
      <Feld id="avatar" spalten={3} titel={texte.avatar.titel}>
        <AvatarFormular name={mitglied.anzeigename} avatarId={mitglied.avatarId} texte={texte.avatar} meldungen={w.meldung} />
      </Feld>
      <Feld id="sichtbarkeit" spalten={3} titel={texte.sichtbarkeit.titel}>
        <ProfilSichtbarkeit
          an={mitglied.profilOeffentlich}
          // Die Kurz-Id eines privaten Profils bleibt auf dem Server (Review Minor 5).
          kurzId={mitglied.profilOeffentlich ? mitglied.kurzId : null}
          moeglich={mitglied.freigegeben}
          texte={texte.sichtbarkeit}
        />
      </Feld>
      <Status freigegeben={mitglied.freigegeben} rolle={mitglied.rolle} texte={texte} />
      <Suspense fallback={<FeldSkelett spalten={6} />}>
        <ViewTransition>
          <ReiheNachrichten id={id} />
        </ViewTransition>
      </Suspense>
      <Suspense
        fallback={
          <>
            <FeldSkelett spalten={6} />
            <FeldSkelett spalten={4} />
          </>
        }
      >
        <ViewTransition>
          <ReiheUmfrage id={id} freigegeben={mitglied.freigegeben} />
        </ViewTransition>
      </Suspense>
      <Suspense fallback={<FeldSkelett spalten={10} hoehe="gross" />}>
        <ViewTransition>
          <ReiheStimmen id={id} />
        </ViewTransition>
      </Suspense>

      {/* Der einzige Einstieg zu /admin. Bewusst nicht in der Navigation:
          die muesste sonst auf jeder Seite die Sitzung lesen und waere
          durchgehend dynamisch. Diese Seite liest sie ohnehin. */}
      {mitglied.rolle === "ADMIN" ? (
        <Feld id="verwaltung" spalten={10} titel={texte.verwaltung} satz={texte.verwaltungText}>
          <Link prefetch={false} href="/admin" className={`${buttonKlassen("secondary")} self-start`}>
            {texte.zurVerwaltung}
          </Link>
        </Feld>
      ) : null}
    </KapitelRaster>
  );
}

/** Freisteller im Kopf: die Sorte deiner letzten Stimme, sonst ein festes Musterbild. */
async function KopfBild({ id }: { id: string }) {
  const stimmen = await stimmenLaden(id);
  const letzte = stimmen?.[0];
  const bildId = letzte ? ersatzBildId(letzte.bildPfad, letzte.slug) : musterBildId("konto");
  return <Bild id={bildId} sizes="(min-width: 1080px) 224px, 0px" dekorativ />;
}

async function Notizen({ id, dabeiSeit }: { id: string; dabeiSeit: Date }) {
  const [{ w, sprache }, zahlen, vorschlaege, nachrichten] = await Promise.all([
    textLaden(),
    stimmZahlen(id).catch(oderNull<Awaited<ReturnType<typeof stimmZahlen>>>("stimmZahlen")),
    vorschlaegeLaden(id),
    nachrichtenLaden(id),
  ]);
  return (
    <Randnotizen
      beschriftung={w.mitglied.kapitel.notizenLeiste}
      notizen={kontoNotizen(
        {
          dabeiSeit,
          stimmen: zahlen?.stimmen ?? 0,
          gewonnen: zahlen?.gewonnen ?? 0,
          vorgeschlagen: vorschlaege?.length ?? 0,
          ungelesen: nachrichten?.filter((n) => !n.gelesen).length ?? 0,
        },
        w.mitglied.kapitel,
        sprache,
      )}
    />
  );
}

/** Dein Status (4): freigegeben oder nicht, und deine Rolle. */
function Status({
  freigegeben,
  rolle,
  texte,
}: {
  freigegeben: boolean;
  rolle: keyof Woerterbuch["mitglied"]["rollen"];
  texte: Woerterbuch["mitglied"];
}) {
  return (
    <Feld id="status" spalten={4} titel={texte.status}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Zustand nie nur ueber Farbe: das Badge traegt Klartext und
            einen Formmarker, daneben steht ein erklaerender Satz. */}
        {freigegeben ? (
          <Badge variante="success">{texte.freigegeben}</Badge>
        ) : (
          <Badge variante="warning">{texte.freigabeAus}</Badge>
        )}
        <Badge variante="neutral" zeichen={false}>
          {t(texte.rolle, { rolle: texte.rollen[rolle] })}
        </Badge>
      </div>
      <p className="max-w-[68ch] text-body text-text-muted">{freigegeben ? texte.freigegebenText : texte.nichtFreigegebenText}</p>
    </Feld>
  );
}

/** Danach: die Umfrage jetzt als Stimmzettel (6) und deine Blüten-Vorschläge (4). */
async function ReiheUmfrage({ id, freigegeben }: { id: string; freigegeben: boolean }) {
  const [{ w, sprache }, umfrage, vorschlaege] = await Promise.all([textLaden(), umfrageLaden(), vorschlaegeLaden(id)]);
  const texte = w.mitglied;
  const eigene = umfrage ? await eigeneStimme(umfrage.id, id).catch(oderNull<Awaited<ReturnType<typeof eigeneStimme>>>("eigeneStimme")) : null;
  return (
    <>
      <Feld id="umfrage" spalten={6} stimmzettel titel={texte.umfrageTitel}>
        <UmfrageJetzt
          umfrage={umfrage}
          eigeneOptionId={eigene}
          freigegeben={freigegeben}
          texte={texte}
          phasen={w.umfrage.phasen}
          sprache={sprache}
        />
      </Feld>
      <Feld id="vorschlaege" spalten={4} titel={texte.meineVorschlaege}>
        {vorschlaege === null ? (
          <p className="max-w-[68ch] text-body text-text">{w.profil.fehler}</p>
        ) : vorschlaege.length === 0 ? (
          <p className="text-body text-text-muted">{texte.keineVorschlaege}</p>
        ) : (
          <ul className="flex w-full flex-col gap-4">
            {vorschlaege.map((v) => (
              <li key={v.id} className="flex flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  {v.strainSlug ? (
                    <Link prefetch={false} href={`/blueten/${v.strainSlug}`} className={`${textLinkKlassen()} wrap-break-word`}>
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
        <Link prefetch={false} href="/vorschlagen" className={`${buttonKlassen("secondary")} self-start`}>
          {texte.vorschlagen}
        </Link>
      </Feld>
    </>
  );
}

/** Zuletzt: deine Stimmen, die Schleife (10). */
async function ReiheStimmen({ id }: { id: string }) {
  const [{ w, sprache }, stimmen] = await Promise.all([textLaden(), stimmenLaden(id)]);
  const texte = w.mitglied;
  return (
    <Feld id="stimmen" spalten={10} titel={texte.stimmenTitel} satz={texte.stimmenSatz}>
      {stimmen === null ? (
        <p className="max-w-[68ch] text-body text-text">{w.profil.fehler}</p>
      ) : (
        <MeineStimmen stimmen={stimmen} texte={texte} sprache={sprache} />
      )}
    </Feld>
  );
}

/** Neben dem Status: deine Benachrichtigungen (6). */
async function ReiheNachrichten({ id }: { id: string }) {
  const [{ w, sprache }, nachrichten] = await Promise.all([textLaden(), nachrichtenLaden(id)]);
  const texte = w.mitglied;
  const ungelesen = (nachrichten ?? []).filter((n) => !n.gelesen).map((n) => n.id);
  return (
    <Feld id="nachrichten" spalten={6} titel={texte.benachrichtigungen}>
      {nachrichten === null ? (
        <p className="max-w-[68ch] text-body text-text">{w.profil.fehler}</p>
      ) : nachrichten.length === 0 ? (
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
                <Link prefetch={false} href={n.link} className={textLinkKlassen()}>
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
    </Feld>
  );
}
