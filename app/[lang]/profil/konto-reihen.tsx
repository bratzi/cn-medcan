import Link from "next/link";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { Feld } from "@/components/kapitel/Feld";
import { AvatarFormular } from "@/components/mitglied/AvatarFormular";
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { MeineStimmen } from "@/components/mitglied/MeineStimmen";
import { ProfilSichtbarkeit } from "@/components/mitglied/ProfilSichtbarkeit";
import { UmfrageJetzt } from "@/components/mitglied/UmfrageJetzt";
import { Badge, buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { VorschlagStatus } from "@/db/enums";
import { benachrichtigungSatz } from "@/lib/benachrichtigung";
import { formatiereDatum } from "@/lib/format";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { eigeneStimme } from "@/lib/query/umfragen";
import type { aktuellesMitglied } from "@/lib/session";

import { nachrichtenLaden, oderNull, stimmenLaden, textLaden, umfrageLaden, vorschlaegeLaden } from "./laden";
import { SPALTEN } from "./spalten";

/*
 * Die Konto-Reihen von /profil (Spec Profil und Konto vereint 3.2), bis 2026-10-13 die Seite
 * /mitglied: Mitbestimmen, deine Stimmen, Nachrichten mit Status und ganz unten die Einstellungen.
 */

type Mitglied = NonNullable<Awaited<ReturnType<typeof aktuellesMitglied>>>;

const STATUS_VARIANTE: Record<VorschlagStatus, "warning" | "success" | "danger"> = {
  OFFEN: "warning",
  FREIGEGEBEN: "success",
  ABGELEHNT: "danger",
};

/** Reihe 6: die Umfrage jetzt als Stimmzettel (7) und deine Blüten-Vorschläge (5). */
export async function ReiheMitbestimmen({ id, freigegeben }: { id: string; freigegeben: boolean }) {
  const [{ w, sprache }, umfrage, vorschlaege] = await Promise.all([textLaden(), umfrageLaden(), vorschlaegeLaden(id)]);
  const texte = w.mitglied;
  const koepfe = w.profil.koepfe;
  const eigene = umfrage ? await eigeneStimme(umfrage.id, id).catch(oderNull<Awaited<ReturnType<typeof eigeneStimme>>>("eigeneStimme")) : null;
  return (
    <>
      <Feld id="umfrage" rahmen="karte" groesse="klein" stimmzettel titel={texte.umfrageTitel} kopf={koepfe.umfrage} ton="gruen" className={SPALTEN[7]}>
        <UmfrageJetzt
          umfrage={umfrage}
          eigeneOptionId={eigene}
          freigegeben={freigegeben}
          texte={texte}
          phasen={w.umfrage.phasen}
          sprache={sprache}
          aktion="secondary"
        />
      </Feld>
      <Feld id="meine-vorschlaege" rahmen="karte" groesse="klein" titel={texte.meineVorschlaege} kopf={koepfe.meineVorschlaege} ton="lila" className={SPALTEN[5]}>
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

/** Reihe 7: deine Stimmen, die Schleife, über die volle Breite. */
export async function ReiheStimmen({ id }: { id: string }) {
  const [{ w, sprache }, stimmen] = await Promise.all([textLaden(), stimmenLaden(id)]);
  const texte = w.mitglied;
  return (
    <Feld id="stimmen" rahmen="karte" groesse="klein" titel={texte.stimmenTitel} kopf={w.profil.koepfe.stimmen} ton="gruen" satz={texte.stimmenSatz} className={SPALTEN[12]}>
      {stimmen === null ? (
        <p className="max-w-[68ch] text-body text-text">{w.profil.fehler}</p>
      ) : (
        <MeineStimmen stimmen={stimmen} texte={texte} sprache={sprache} />
      )}
    </Feld>
  );
}

/** Reihe 8: deine Benachrichtigungen (7), daneben dein Status (5). */
export async function ReiheNachrichten({ id, freigegeben, rolle }: { id: string; freigegeben: boolean; rolle: Mitglied["rolle"] }) {
  const [{ w, sprache }, nachrichten] = await Promise.all([textLaden(), nachrichtenLaden(id)]);
  const texte = w.mitglied;
  const ungelesen = (nachrichten ?? []).filter((n) => !n.gelesen).map((n) => n.id);
  return (
    <>
      <Feld id="nachrichten" rahmen="karte" groesse="klein" titel={texte.benachrichtigungen} kopf={w.profil.koepfe.nachrichten} ton="lila" className={SPALTEN[7]}>
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
      <Status freigegeben={freigegeben} rolle={rolle} texte={texte} kopf={w.profil.koepfe.status} />
    </>
  );
}

/** Dein Status: freigegeben oder nicht, und deine Rolle. */
function Status({
  freigegeben,
  rolle,
  texte,
  kopf,
}: {
  freigegeben: boolean;
  rolle: keyof Woerterbuch["mitglied"]["rollen"];
  texte: Woerterbuch["mitglied"];
  kopf: Woerterbuch["profil"]["koepfe"]["status"];
}) {
  return (
    <Feld id="status" rahmen="karte" groesse="klein" titel={texte.status} kopf={kopf} ton="gruen" className={SPALTEN[5]}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Zustand nie nur über Farbe: das Badge trägt Klartext und einen Formmarker, daneben steht ein erklärender Satz. */}
        {freigegeben ? <Badge variante="success">{texte.freigegeben}</Badge> : <Badge variante="warning">{texte.freigabeAus}</Badge>}
        <Badge variante="neutral" zeichen={false}>
          {t(texte.rolle, { rolle: texte.rollen[rolle] })}
        </Badge>
      </div>
      <p className="max-w-[68ch] text-body text-text-muted">{freigegeben ? texte.freigegebenText : texte.nichtFreigegebenText}</p>
    </Feld>
  );
}

/** Reihe 9: Angaben, Profilbild, Öffentliches Profil nebeneinander, darunter Abmelden; für Admins die Verwaltung. */
export async function ReiheEinstellungen({ mitglied }: { mitglied: Mitglied }) {
  const { w } = await textLaden();
  const texte = w.mitglied;
  return (
    <>
      <Feld
        id="einstellungen"
        rahmen="karte"
        groesse="klein"
        titel={texte.einstellungenTitel}
        kopf={w.profil.koepfe.einstellungen}
        ton="lila"
        className={SPALTEN[12]}
      >
        <div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-3">
          <section aria-labelledby="angaben-titel" className="flex min-w-0 flex-col gap-4">
            <h3 id="angaben-titel" className="font-buch text-h3 text-text">
              {texte.angaben}
            </h3>
            <ProfilFormular anzeigename={mitglied.anzeigename} instagramHandle={mitglied.instagramHandle} texte={texte.profil} />
          </section>
          <section aria-labelledby="avatar-titel" className="flex min-w-0 flex-col gap-4">
            <h3 id="avatar-titel" className="font-buch text-h3 text-text">
              {texte.avatar.titel}
            </h3>
            <AvatarFormular name={mitglied.anzeigename} avatarId={mitglied.avatarId} texte={texte.avatar} meldungen={w.meldung} />
          </section>
          <section aria-labelledby="sichtbarkeit-titel" className="flex min-w-0 flex-col gap-4">
            <h3 id="sichtbarkeit-titel" className="font-buch text-h3 text-text">
              {texte.sichtbarkeit.titel}
            </h3>
            <ProfilSichtbarkeit
              an={mitglied.profilOeffentlich}
              // Die Kurz-Id eines privaten Profils bleibt auf dem Server (Review Minor 5).
              kurzId={mitglied.profilOeffentlich ? mitglied.kurzId : null}
              moeglich={mitglied.freigegeben}
              texte={texte.sichtbarkeit}
            />
          </section>
        </div>
        <div className="border-t border-border pt-6">
          <AbmeldeButton texte={w.auth.formular} />
        </div>
      </Feld>
      {/* Der einzige Einstieg zu /admin, bewusst nicht in der Navigation: die müsste sonst auf
          jeder Seite die Sitzung lesen und wäre durchgehend dynamisch. Diese Seite liest sie ohnehin. */}
      {mitglied.rolle === "ADMIN" ? (
        <Feld
          id="verwaltung"
          rahmen="karte"
          groesse="klein"
          titel={texte.verwaltung}
          kopf={w.profil.koepfe.verwaltung}
          ton="gruen"
          satz={texte.verwaltungText}
          className={SPALTEN[12]}
        >
          <Link prefetch={false} href="/admin" className={`${buttonKlassen("secondary")} self-start`}>
            {texte.zurVerwaltung}
          </Link>
        </Feld>
      ) : null}
    </>
  );
}
