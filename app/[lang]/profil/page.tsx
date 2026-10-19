import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { ProfilKopf } from "@/components/profil/ProfilKopf";
import { summeOffen } from "@/lib/admin-aufgaben";
import { registerParameter } from "@/lib/bewertungs-register";
import { holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { kontoNotizen } from "@/lib/konto";
import { leereProfilWerte } from "@/lib/profil";
import { liebsteAromen } from "@/lib/profil-ansicht";
import { profilNotizen } from "@/lib/profil-dashboard";
import { kopfNotizen } from "@/lib/profil-kopf";
import { ladeAdminZaehler } from "@/lib/query/admin-uebersicht";
import { aktuellesMitglied } from "@/lib/session";

import { ReiheJury } from "./jury-reihe";
import {
  ReiheEinstellungen,
  ReiheMitbestimmen,
  ReiheNachrichten,
  ReiheStimmen,
} from "./konto-reihen";
import {
  nachrichtenLaden,
  profilLaden,
  reaktionsZahlenLaden,
  stimmZahlenLaden,
  textLaden,
  vorschlaegeLaden,
  zeilenLaden,
} from "./laden";
import {
  ReiheAehnliches,
  ReiheGemocht,
  ReiheGeschmack,
  ReiheRegister,
  ReiheVertreiber,
  ReiheVerlauf,
} from "./profil-reihen";
import { SPALTEN } from "./spalten";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await holeWoerterbuch()).profil.titel,
    robots: { index: false, follow: false },
  };
}

type SuchParameter = Record<string, string | string[] | undefined>;

/**
 * Mein Profil (Spec Profil und Konto vereint 2026-10-13): oben der Profilkopf (ab 1080 px sticky),
 * darunter zwei Reiter (Nutzer 2026-10-14): „Profil“ mit allen Boxen vom Geschmack bis zu den
 * Nachrichten, „Profil bearbeiten“ (`?ansicht=bearbeiten`) mit den Einstellungen. Jede Reihe streamt
 * für sich; jede Quelle wird je Aufruf einmal gelesen (laden.ts, CPU 10 ms). Andere Werte von
 * „ansicht“ aus alten Links zeigen das Profil. Nur Aroma in Netz und Vorschlägen (HWG).
 */
export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const mitglied = await aktuellesMitglied();
  const { w, sprache } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const parameter = await searchParams;
  const register = registerParameter(parameter);
  const bearbeiten = parameter.ansicht === "bearbeiten";
  const id = mitglied.mitgliedId;
  const s = w.profil.seite;
  const offen = mitglied.rolle === "ADMIN" ? summeOffen(await ladeAdminZaehler()) : null;
  const kopf = {
    name: mitglied.anzeigename,
    avatarId: mitglied.avatarId,
    rolle:
      mitglied.rolle === "ADMIN"
        ? ("betreiber" as const)
        : ("mitglied" as const),
    seit: mitglied.erstelltAm,
    aktionen: seitenAktionen(s, offen),
    texte: s,
    sprache,
  };
  const skelett = <FeldSkelett rahmen="karte" className={SPALTEN[12]} />;

  return (
    <div className="pb-16">
      <Suspense fallback={<ProfilKopf {...kopf} gruppen={[]} aromen={[]} />}>
        <Kopf id={id} {...kopf} />
      </Suspense>
      <nav
        aria-label={s.reiterLeiste}
        className="mx-auto w-full max-w-360 px-4 pt-6 sm:px-8"
      >
        <ul className="flex gap-2 border-b border-border">
          {[
            {
              href: "/profil",
              text: w.profil.reiterProfil,
              aktiv: !bearbeiten,
            },
            {
              href: "/profil?ansicht=bearbeiten",
              text: s.bearbeiten,
              aktiv: bearbeiten,
            },
          ].map((r) => (
            <li key={r.href}>
              <Link
                prefetch={false}
                href={r.href}
                aria-current={r.aktiv ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-small font-medium transition-colors duration-fast ${
                  r.aktiv
                    ? "border-accent text-text"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {r.text}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 pt-8 sm:px-8 min-[1280px]:grid-cols-12">
        {bearbeiten ? (
          <Suspense fallback={skelett}>
            <ReiheEinstellungen mitglied={mitglied} />
          </Suspense>
        ) : (
          <>
            {mitglied.jury ? (
              <Suspense fallback={skelett}>
                <ReiheJury id={id} offen={typeof parameter.jury === "string" ? parameter.jury : null} frischGespeichert={parameter.gespeichert === "1"} eingereicht={parameter.eingereicht === "1"} />
              </Suspense>
            ) : null}
            <Suspense
              fallback={
                <FeldSkelett
                  rahmen="karte"
                  hoehe="gross"
                  className={SPALTEN[12]}
                />
              }
            >
              <ReiheGeschmack id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheVerlauf id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheRegister id={id} register={register} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheAehnliches id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheVertreiber id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheMitbestimmen id={id} freigegeben={mitglied.freigegeben} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheStimmen id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheGemocht id={id} />
            </Suspense>
            <Suspense fallback={skelett}>
              <ReiheNachrichten
                id={id}
                freigegeben={mitglied.freigegeben}
                rolle={mitglied.rolle}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}

/** Der Weg im Profilkopf; auch im Suspense-Fallback bekannt. „Profil bearbeiten“ steht nur im Reiter. */
function seitenAktionen(s: Woerterbuch["profil"]["seite"], offen: number | null) {
  const bewerten = { href: "/blueten", text: s.bewerten, art: "primary" } as const;
  if (offen === null) return [bewerten] as const;
  return [
    bewerten,
    { href: "/admin", text: offen > 0 ? t(s.verwaltungOffen, { zahl: String(offen) }) : s.verwaltung, art: "secondary" },
  ] as const;
}

/** Zahlen und liebste Aromen; die Quellen teilen sich Kopf und Boxen über laden.ts. */
async function Kopf({
  id,
  ...kopf
}: { id: string } & Omit<
  Parameters<typeof ProfilKopf>[0],
  "gruppen" | "aromen"
>) {
  const [{ w, sprache }, zeilen, profil, zahlen, vorschlaege, nachrichten, reaktionen] =
    await Promise.all([
      textLaden(),
      zeilenLaden(id),
      profilLaden(id),
      stimmZahlenLaden(id),
      vorschlaegeLaden(id),
      nachrichtenLaden(id),
      reaktionsZahlenLaden(id),
    ]);
  // Ohne auswertungen(): die Community-Zahl steht nicht im Kopf (ohneCommunity), das spart CPU.
  const profilZahlen: Randnotiz[] =
    zeilen === null
      ? []
      : profilNotizen(
          {
            zeilen,
            differenz: null,
            hersteller: new Set(zeilen.map((z) => z.vertreiber).filter(Boolean))
              .size,
          },
          w.profil.kapitel,
          sprache,
          { ohneCommunity: true },
        );
  const kontoZahlen = kontoNotizen(
    {
      dabeiSeit: kopf.seit ?? new Date(),
      stimmen: zahlen?.stimmen ?? 0,
      gewonnen: zahlen?.gewonnen ?? 0,
      vorgeschlagen: vorschlaege?.length ?? 0,
      ungelesen: nachrichten?.filter((n) => !n.gelesen).length ?? 0,
    },
    w.mitglied.kapitel,
    sprache,
  );
  const aromen = liebsteAromen(
    (profil?.werte ?? leereProfilWerte()).geschmack,
  ).map((a) => w.label.geschmack[a]);
  const z = kopfNotizen(profilZahlen, kontoZahlen);
  const s = w.profil.seite;
  // Folgende und erhaltene Likes aus dem Zähler; bei Ladefehler entfallen die zwei Zahlen still.
  const reaktionsZahlen: Randnotiz[] = reaktionen
    ? [
        {
          zahl: String(reaktionen.folgende),
          wort: mehrzahl(sprache, w.profil.kopf.folgende.wort, reaktionen.folgende),
          satz: mehrzahl(sprache, w.profil.kopf.folgende.sr, reaktionen.folgende),
          href: "#gemocht-titel",
        },
        {
          zahl: String(reaktionen.likesErhalten),
          wort: mehrzahl(sprache, w.profil.kopf.likesErhalten.wort, reaktionen.likesErhalten),
          satz: mehrzahl(sprache, w.profil.kopf.likesErhalten.sr, reaktionen.likesErhalten),
          // Die Register-Box (id „bewertungen“) gibt es nur mit Bewertungen; sonst das Netz, wie kopfNotizen.
          href: zeilen && zeilen.length > 0 ? "#bewertungen-titel" : "#netz-titel",
        },
      ]
    : [];
  return (
    <ProfilKopf
      {...kopf}
      gruppen={[
        { titel: s.gruppeBewertungen, notizen: z.profil },
        { titel: s.gruppeMitbestimmung, notizen: z.konto },
        { titel: s.gruppeReaktionen, notizen: reaktionsZahlen },
      ]}
      aromen={aromen}
    />
  );
}
