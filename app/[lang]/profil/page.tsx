import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache, Suspense } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilRahmen } from "@/components/profil/ProfilRahmen";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { ProfilSeitenleiste } from "@/components/profil/ProfilSeitenleiste";
import { Schnitte } from "@/components/profil/Schnitte";
import { TopFlop } from "@/components/profil/TopFlop";
import { buttonKlassen } from "@/components/ui";
import { registerAnsicht, registerParameter } from "@/lib/bewertungs-register";
import { begruendungText } from "@/lib/empfehlung-text";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { auswertungen, leereProfilWerte } from "@/lib/profil";
import { ansichtAus, liebsteAromen, PROFIL_ANSICHTEN } from "@/lib/profil-ansicht";
import { monatsReihe, notenVerteilung, profilNotizen } from "@/lib/profil-dashboard";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeLieblingshersteller } from "@/lib/query/lieblingshersteller";
import { aktuellesProfil, ladeAuswertungsZeilen } from "@/lib/query/profil";
import { aktuellesMitglied } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).profil.titel, robots: { index: false, follow: false } };
}

/** Wie oderNull, aber undefined: der Aufrufer unterscheidet „gescheitert“ von „keiner“. */
function oderUndefined<T>(name: string) {
  return (fehler: unknown): T | undefined => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return undefined;
  };
}

/** Fehler eines Teils reißen die Seite nicht mit (wie /mitglied); Redirects gehen durch. */
function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

// Je Aufruf eine Abfrage je Quelle, auch wenn mehrere Felder sie lesen (Spec 9).
// Erst das Profil: ist es veraltet, schreibt es auch die Vorschläge neu.
const profilLaden = cache((id: string) =>
  aktuellesProfil(id).catch(oderNull<Awaited<ReturnType<typeof aktuellesProfil>>>("aktuellesProfil")),
);
const zeilenLaden = cache((id: string) =>
  ladeAuswertungsZeilen(id).catch(oderNull<Awaited<ReturnType<typeof ladeAuswertungsZeilen>>>("ladeAuswertungsZeilen")),
);
const textLaden = cache(async () => {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return { w, sprache };
});

type SuchParameter = Record<string, string | string[] | undefined>;

/**
 * Dein Profil (Spec Profil Desktop 2026-10-13): links die Seitenleiste, rechts Reiter und je Ansicht
 * ihre Felder. Seitenleiste und Reiter stehen sofort, die Felder streamen je Ansicht mit einem
 * Skelett. Profilwerte kommen vorberechnet aus nutzer_profil; neu gerechnet wird nur, wenn der Stand
 * fehlt oder älter als 24 h ist (CPU-Limit 10 ms). Nur Aroma in Netz und Vorschlägen (HWG).
 */
export default async function ProfilPage({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  const mitglied = await aktuellesMitglied();
  const { w, sprache } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const parameter = await searchParams;
  const ansicht = ansichtAus(parameter.ansicht);
  const register = registerParameter(parameter);
  const id = mitglied.mitgliedId;
  const s = w.profil.seite;
  const rolleKennung = mitglied.rolle === "ADMIN" ? "betreiber" : "mitglied";
  const aktionen = seitenAktionen(s);

  return (
    <ProfilRahmen
      seitenleiste={
        <Suspense
          fallback={
            <ProfilSeitenleiste
              name={mitglied.anzeigename}
              avatarId={mitglied.avatarId}
              rolle={rolleKennung}
              seit={mitglied.erstelltAm}
              notizen={[]}
              aromen={[]}
              aktionen={aktionen}
              texte={s}
              sprache={sprache}
            />
          }
        >
          <Seitenleiste
            id={id}
            name={mitglied.anzeigename}
            avatarId={mitglied.avatarId}
            rolle={rolleKennung}
            seit={mitglied.erstelltAm}
          />
        </Suspense>
      }
      reiter={
        <ProfilReiter
          basis="/profil"
          aktiv={ansicht}
          beschriftung={s.reiterLeiste}
          reiter={PROFIL_ANSICHTEN.map((a) => ({ ansicht: a, text: s.reiter[a] }))}
        />
      }
    >
      {ansicht === "uebersicht" ? (
        <Suspense fallback={<FeldSkelett rahmen="karte" hoehe="gross" />}>
          <AnsichtUebersicht id={id} />
        </Suspense>
      ) : null}
      {ansicht === "aromen" ? (
        <Suspense fallback={<FeldSkelett rahmen="karte" hoehe="gross" />}>
          <div className="flex flex-col gap-8">
            <ReiheNetz id={id} />
            <ReiheVorschlaege id={id} />
          </div>
        </Suspense>
      ) : null}
      {ansicht === "bewertungen" ? (
        <Suspense fallback={<FeldSkelett rahmen="karte" hoehe="gross" />}>
          <ReiheRegister id={id} register={register} />
        </Suspense>
      ) : null}
      {ansicht === "vertreiber" ? (
        <Suspense fallback={<FeldSkelett rahmen="karte" />}>
          <AnsichtVertreiber id={id} />
        </Suspense>
      ) : null}
    </ProfilRahmen>
  );
}

/** Die zwei Wege der Seitenleiste; auch im Suspense-Fallback bekannt. */
function seitenAktionen(s: Woerterbuch["profil"]["seite"]) {
  return [
    { href: "/blueten", text: s.bewerten, art: "primary" },
    { href: "/mitglied", text: s.bearbeiten, art: "secondary" },
  ] as const;
}

/** Identität links: Zahlen als Randnotizen und die liebsten Aromen aus dem gespeicherten Profil. */
async function Seitenleiste({
  id,
  name,
  avatarId,
  rolle,
  seit,
}: {
  id: string;
  name: string;
  avatarId: string | null;
  rolle: "betreiber" | "mitglied";
  seit: Date;
}) {
  const [{ w, sprache }, zeilen, profil] = await Promise.all([textLaden(), zeilenLaden(id), profilLaden(id)]);
  const s = w.profil.seite;
  let notizen: ReturnType<typeof profilNotizen> = [];
  if (zeilen !== null) {
    const a = auswertungen(zeilen);
    const hersteller = new Set(zeilen.map((z) => z.vertreiber).filter(Boolean)).size;
    notizen = profilNotizen({ zeilen, differenz: a.community.differenz, hersteller }, w.profil.kapitel, sprache, { ohneCommunity: true });
  }
  const aromen = liebsteAromen((profil?.werte ?? leereProfilWerte()).geschmack).map((a) => w.label.geschmack[a]);
  return (
    <ProfilSeitenleiste
      name={name}
      avatarId={avatarId}
      rolle={rolle}
      seit={seit}
      notizen={notizen}
      aromen={aromen}
      aktionen={seitenAktionen(s)}
      texte={s}
      sprache={sprache}
    />
  );
}

/** Übersicht: Netz und Top/Flop, darunter die Spur seit der ersten Bewertung und die Noten. */
async function AnsichtUebersicht({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  const texte = w.profil;
  if (zeilen === null) {
    return (
      <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} kopf={texte.koepfe.netz} ton="lila">
        <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
      </Feld>
    );
  }
  if (zeilen.length === 0) {
    return (
      <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} kopf={texte.koepfe.netz} ton="lila">
        <p className="max-w-[68ch] text-body text-text-muted">{texte.leer}</p>
        {/* Die gefüllte Primäraktion steht schon in der Seitenleiste: hier die zweite Stufe. */}
        <Link prefetch={false} href="/blueten" className={`${buttonKlassen("secondary", "md")} self-start`}>
          {texte.seite.bewerten}
        </Link>
      </Feld>
    );
  }
  const a = auswertungen(zeilen);
  return (
    <div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-12">
      <ReiheNetz id={id} netzKlasse="min-[1280px]:col-span-7" />
      <Feld id="topflop" rahmen="karte" groesse="klein" titel={texte.topFlopTitel} kopf={texte.koepfe.topFlop} ton="lila" className="min-[1280px]:col-span-5">
        <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
      </Feld>
      <Feld
        id="aktivitaet"
        rahmen="karte"
        groesse="klein"
        titel={texte.aktivitaetTitel}
        kopf={texte.koepfe.aktivitaet}
        ton="gruen"
        satz={texte.aktivitaetSatz}
        className="min-[1280px]:col-span-7"
      >
        <Aktivitaet monate={monatsReihe(zeilen.map((z) => z.erstelltAm), new Date(), sprache, { abErster: true })} texte={texte} kompakt />
      </Feld>
      <Feld
        id="verteilung"
        rahmen="karte"
        groesse="klein"
        titel={texte.verteilungTitel}
        kopf={texte.koepfe.noten}
        ton="lila"
        satz={texte.verteilungSatz}
        className="min-[1280px]:col-span-5"
      >
        <NotenVerteilung stufen={notenVerteilung(zeilen)} texte={texte} />
      </Feld>
    </div>
  );
}

/** Vertreiber: Lieblingshersteller (über beide Spalten), Schnitte und Community. */
async function AnsichtVertreiber({ id }: { id: string }) {
  const [{ w, sprache }, zeilen, liebling] = await Promise.all([
    textLaden(),
    zeilenLaden(id),
    ladeLieblingshersteller(id).catch(oderUndefined<Awaited<ReturnType<typeof ladeLieblingshersteller>>>("ladeLieblingshersteller")),
  ]);
  const texte = w.profil;
  if (zeilen === null || zeilen.length === 0) {
    return (
      <Feld id="hersteller" rahmen="karte" groesse="klein" titel={texte.herstellerTitel} kopf={texte.koepfe.hersteller} ton="lila">
        <p className="max-w-[68ch] text-body text-text-muted">{zeilen === null ? texte.fehler : texte.leer}</p>
      </Feld>
    );
  }
  const a = auswertungen(zeilen);
  return (
    <div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-2">
      <Feld id="hersteller" rahmen="karte" groesse="klein" titel={texte.herstellerTitel} kopf={texte.koepfe.hersteller} ton="lila" className="min-[1280px]:col-span-2">
        <Lieblingshersteller daten={liebling} texte={texte} sprache={sprache} />
      </Feld>
      {a.schnitte ? (
        <Feld id="schnitte" rahmen="karte" groesse="klein" titel={texte.schnitteTitel} kopf={texte.koepfe.schnitte} ton="gruen" satz={texte.schnitteSatz}>
          <Schnitte daten={a.schnitte} texte={texte} noten={w.schema.noten} sprache={sprache} />
        </Feld>
      ) : null}
      <Feld id="community" rahmen="karte" groesse="klein" titel={texte.communityTitel} kopf={texte.koepfe.community} ton="lila" className={a.schnitte ? undefined : "min-[1280px]:col-span-2"}>
        <CommunityVergleich daten={a.community} texte={texte} sprache={sprache} />
      </Feld>
    </div>
  );
}

/** Das Aroma-Netz; die Terpene stecken seit 2026-10-09 im Netz (Schalter). */
async function ReiheNetz({ id, netzKlasse }: { id: string; netzKlasse?: string }) {
  const [{ w, sprache }, profil, zeilen] = await Promise.all([textLaden(), profilLaden(id), zeilenLaden(id)]);
  const texte = w.profil;
  const werte = profil?.werte ?? leereProfilWerte();
  // Der Verlauf läuft seit 2026-10-09 im selben Netz (Nutzer: zwei Netze wirkten doppelt);
  // der vorige Stand steht dort als dünne Kontur.
  const verlauf = profil?.verlauf ?? [];
  // Kein gespeicherter Stand, obwohl es Bewertungen gibt oder sich das nicht
  // prüfen lässt: dann nie die Leerskizze „Erste Bewertung abgeben“ zeigen.
  const netzFehlt = profil === null && (zeilen === null || zeilen.length > 0);
  return (
    <Feld
      id="netz"
      rahmen="karte"
      groesse="klein"
      titel={texte.netzTitel}
      kopf={texte.koepfe.netz}
      ton="lila"
      satz={!netzFehlt && werte.anzahl > 0 ? texte.netzSatz : undefined}
      className={netzKlasse}
    >
      {netzFehlt ? (
        <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
      ) : (
        <div data-netz-erscheinen="" className="mx-auto w-full max-w-160">
          <ProfilNetz
            werte={werte}
            texte={texte}
            achsen={w.label.geschmack}
            sprache={sprache}
            verlauf={verlauf}
            className="w-full max-w-xl"
          />
        </div>
      )}
    </Feld>
  );
}

/** Aromen: Ähnliches im Aroma (Nutzer 2026-10-09: unter dem Netz). */
async function ReiheVorschlaege({ id }: { id: string }) {
  const { w, sprache } = await textLaden();
  const texte = w.profil;
  // Erst das Profil, dann die Vorschläge: ein veraltetes Profil schreibt sie neu.
  await profilLaden(id);
  const empfehlungen = await ladeEmpfehlungen(id).catch(oderNull<Awaited<ReturnType<typeof ladeEmpfehlungen>>>("ladeEmpfehlungen"));
  return (
    <Feld id="vorschlaege" rahmen="karte" groesse="klein" titel={texte.vorschlaegeTitel} kopf={texte.koepfe.vorschlaege} ton="gruen">
      {empfehlungen === null ? (
        <p className="max-w-[68ch] text-body text-text">{w.empfehlung.fehler}</p>
      ) : empfehlungen.length === 0 ? (
        <p className="max-w-[68ch] text-body text-text-muted">{w.empfehlung.leer}</p>
      ) : (
        <EmpfehlungsListe
          className="w-full"
          eintraege={empfehlungen.map((e) => ({
            slug: e.slug,
            handelsname: e.handelsname,
            begruendung: begruendungText(e, w, sprache),
            marke: e.bestaetigt ? undefined : texte.nichtBestaetigt,
          }))}
        />
      )}
      <p className="text-caption text-text-muted">
        {texte.bestaetigtHinweis} {w.empfehlung.hinweis}
      </p>
    </Feld>
  );
}

/** Bewertungen: deine Bewertungen als Register mit Bildern. */
async function ReiheRegister({ id, register }: { id: string; register: ReturnType<typeof registerParameter> }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  const texte = w.profil;
  return (
    <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.registerTitel} kopf={texte.koepfe.register} ton="lila" satz={texte.registerSatz}>
      {zeilen === null ? (
        <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
      ) : (
        <BewertungsRegister
          ansicht={registerAnsicht(zeilen, register)}
          sortierung={register.sortierung}
          alle={register.alle}
          texte={texte}
          sprache={sprache}
        />
      )}
    </Feld>
  );
}
