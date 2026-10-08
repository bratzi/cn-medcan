import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache, Suspense, ViewTransition } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Kapitelkopf } from "@/components/kapitel/Kapitelkopf";
import { KapitelRaster } from "@/components/kapitel/KapitelRaster";
import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { Bild, BudpicBild } from "@/components/medien/Bild";
import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { NetzVerlauf } from "@/components/profil/NetzVerlauf";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { Schnitte } from "@/components/profil/Schnitte";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { TopFlop } from "@/components/profil/TopFlop";
import { registerAnsicht, registerParameter } from "@/lib/bewertungs-register";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { musterBildId } from "@/lib/budpics";
import { begruendungText } from "@/lib/empfehlung-text";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { auswertungen, leereProfilWerte, noteOderErsatz } from "@/lib/profil";
import { monatsReihe, notenVerteilung, profilNotizen } from "@/lib/profil-dashboard";
import { ungeleseneAnzahl } from "@/lib/query/benachrichtigungen";
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
 * Dein Kapitel im Grünen Buch (Spec Profil und Konto 3 bis 6): Kopf und Reiter
 * stehen sofort, die Feldreihen streamen je mit einem Skelett. Profilwerte
 * kommen vorberechnet aus nutzer_profil; neu gerechnet wird nur, wenn der
 * Stand fehlt oder älter als 24 h ist (CPU-Limit 10 ms). Nur Aroma in Netz
 * und Vorschlägen (HWG).
 */
export default async function ProfilPage({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  const mitglied = await aktuellesMitglied();
  const { w, sprache } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const texte = w.profil;
  const id = mitglied.mitgliedId;
  const register = registerParameter(await searchParams);
  const ungelesen = await ungeleseneAnzahl(id).catch(oderNull<number>("ungeleseneAnzahl")).then((n) => n ?? 0);

  return (
    <KapitelRaster>
      <ViewTransition name="kapitel-kopf">
        <Kapitelkopf
          name={mitglied.anzeigename}
          avatarId={mitglied.avatarId}
          schlagwort={texte.kapitel.schlagwort}
          ton="gruen"
          bild={
            <Suspense fallback={null}>
              <KopfBild id={id} />
            </Suspense>
          }
          reiter={
            <ProfilReiter
              aktiv="profil"
              texte={texte}
              ungelesen={{ anzahl: ungelesen, text: mehrzahl(sprache, w.kopf.ungelesen, ungelesen) }}
            />
          }
        />
      </ViewTransition>
      <Suspense fallback={<FeldSkelett spalten={10} hoehe="klein" />}>
        <ViewTransition>
          <Notizen id={id} />
        </ViewTransition>
      </Suspense>
      <Suspense
        fallback={
          <>
            <FeldSkelett spalten={6} hoehe="gross" />
            <FeldSkelett spalten={4} hoehe="gross" />
          </>
        }
      >
        <ViewTransition>
          <ReiheNetz id={id} />
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
          <ReiheVorschlaege id={id} />
        </ViewTransition>
      </Suspense>
      <Suspense fallback={<FeldSkelett spalten={10} />}>
        <ViewTransition>
          <ReiheAuswertung id={id} />
        </ViewTransition>
      </Suspense>
      <Suspense fallback={<FeldSkelett spalten={10} hoehe="gross" />}>
        <ViewTransition>
          <ReiheRegister id={id} register={register} />
        </ViewTransition>
      </Suspense>
    </KapitelRaster>
  );
}

/** Freisteller im Kopf: deine bestbewertete Sorte, ohne Bewertung ein festes Musterbild. */
async function KopfBild({ id }: { id: string }) {
  const zeilen = await zeilenLaden(id);
  const beste = zeilen?.length ? zeilen.reduce((a, b) => (noteOderErsatz(b) > noteOderErsatz(a) ? b : a)) : null;
  if (beste?.eigenesBild) {
    const { id: bildId, breite, hoehe, offen } = beste.eigenesBild;
    return <BudpicBild id={bildId} breite={breite} hoehe={hoehe} offen={offen} alt="" className="h-auto w-full object-contain" />;
  }
  const bildId = beste ? ersatzBildId(beste.bildPfad, beste.slug) : musterBildId("profil");
  return <Bild id={bildId} sizes="(min-width: 1080px) 35vw, 0px" dekorativ />;
}

async function Notizen({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (zeilen === null) return null;
  const a = auswertungen(zeilen);
  const hersteller = new Set(zeilen.map((z) => z.hersteller).filter(Boolean)).size;
  return (
    <Randnotizen
      beschriftung={w.profil.kapitel.notizenLeiste}
      notizen={profilNotizen({ zeilen, differenz: a.community.differenz, hersteller }, w.profil.kapitel, sprache)}
    />
  );
}

/** Reihe 1: Netz (6) und Terpene (4). */
async function ReiheNetz({ id }: { id: string }) {
  const [{ w, sprache }, profil, zeilen] = await Promise.all([textLaden(), profilLaden(id), zeilenLaden(id)]);
  const texte = w.profil;
  const werte = profil?.werte ?? leereProfilWerte();
  // Stufe 3: Kontur und Änderungszeile aus den letzten zwei Schritten des Verlaufs.
  const verlauf = profil?.verlauf ?? [];
  const letzter = verlauf.at(-1);
  const vorletzter = verlauf.at(-2);
  let aenderung: string | null = null;
  if (letzter && vorletzter) {
    const liste = netzAenderung(vorletzter.geschmack, letzter.geschmack);
    const datum = formatiereDatum(letzter.datum, sprache);
    aenderung =
      liste.length > 0
        ? t(texte.aenderung, { datum, liste: aenderungsListe(liste, w.label.geschmack, texte) })
        : t(texte.aenderungGleich, { datum });
  }
  // Kein gespeicherter Stand, obwohl es Bewertungen gibt oder sich das nicht
  // prüfen lässt: dann nie die Leerskizze „Erste Bewertung abgeben“ zeigen.
  const netzFehlt = profil === null && (zeilen === null || zeilen.length > 0);
  return (
    <>
      <Feld id="netz" spalten={6} titel={texte.netzTitel} satz={!netzFehlt && werte.anzahl > 0 ? texte.netzSatz : undefined}>
        {netzFehlt ? (
          <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
        ) : (
          <div data-netz-erscheinen="" className="mx-auto w-full max-w-160">
            <ProfilNetz
              werte={werte}
              texte={texte}
              achsen={w.label.geschmack}
              sprache={sprache}
              vorher={vorletzter?.geschmack ?? null}
              aenderung={aenderung}
            />
          </div>
        )}
      </Feld>
      <Feld id="terpene" spalten={4} titel={texte.terpeneTitel}>
        {netzFehlt ? (
          <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
        ) : werte.terpene.length === 0 ? (
          <p className="max-w-[68ch] text-body text-text-muted">{texte.leer}</p>
        ) : (
          <TerpenRangliste terpene={werte.terpene} texte={texte} sprache={sprache} ohneTitel />
        )}
      </Feld>
    </>
  );
}

/** Reihe 2: bestätigte Vorschläge (6) und Verlauf (4). */
async function ReiheVorschlaege({ id }: { id: string }) {
  const { w, sprache } = await textLaden();
  const texte = w.profil;
  // Erst das Profil, dann die Vorschläge: ein veraltetes Profil schreibt sie neu.
  const profil = await profilLaden(id);
  const [empfehlungen, zeilen] = await Promise.all([
    ladeEmpfehlungen(id).catch(oderNull<Awaited<ReturnType<typeof ladeEmpfehlungen>>>("ladeEmpfehlungen")),
    zeilenLaden(id),
  ]);
  const netzFehlt = profil === null && (zeilen === null || zeilen.length > 0);
  return (
    <>
      <Feld id="vorschlaege" spalten={6} titel={texte.vorschlaegeTitel}>
        {empfehlungen === null ? (
          <p className="max-w-[68ch] text-body text-text">{w.empfehlung.fehler}</p>
        ) : empfehlungen.length === 0 ? (
          <p className="max-w-[68ch] text-body text-text-muted">{w.empfehlung.leer}</p>
        ) : (
          <EmpfehlungsListe
            schmal
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
      <Feld id="verlauf" spalten={4} titel={texte.verlaufTitel}>
        {netzFehlt ? (
          <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
        ) : (
          <NetzVerlauf schritte={profil?.verlauf ?? []} texte={texte} achsen={w.label.geschmack} sprache={sprache} />
        )}
      </Feld>
    </>
  );
}

/**
 * Reihen 3 bis 5: Aktivität (10); Notenverteilung (3), Top und Flop (4),
 * Lieblingshersteller (3); Community (6), Schnitte (4). Ohne Bewertung nur
 * die Aktivität mit ihrem Leersatz.
 */
async function ReiheAuswertung({ id }: { id: string }) {
  const [{ w, sprache }, zeilen, liebling] = await Promise.all([
    textLaden(),
    zeilenLaden(id),
    ladeLieblingshersteller(id).catch(oderUndefined<Awaited<ReturnType<typeof ladeLieblingshersteller>>>("ladeLieblingshersteller")),
  ]);
  const texte = w.profil;
  if (zeilen === null) {
    return (
      <Feld id="auswertung" spalten={10} titel={texte.aktivitaetTitel}>
        <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
      </Feld>
    );
  }
  const a = auswertungen(zeilen);
  return (
    <>
      <Feld id="aktivitaet" spalten={10} titel={texte.aktivitaetTitel} satz={texte.aktivitaetSatz}>
        <Aktivitaet monate={monatsReihe(zeilen.map((z) => z.erstelltAm), new Date(), sprache)} texte={texte} />
      </Feld>
      {a.schnitte ? (
        <>
          <Feld id="verteilung" spalten={3} titel={texte.verteilungTitel} satz={texte.verteilungSatz}>
            <NotenVerteilung stufen={notenVerteilung(zeilen)} texte={texte} />
          </Feld>
          <Feld id="topflop" spalten={4} titel={texte.topFlopTitel}>
            <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
          </Feld>
          <Feld id="hersteller" spalten={3} titel={texte.herstellerTitel}>
            <Lieblingshersteller daten={liebling} texte={texte} sprache={sprache} />
          </Feld>
          <Feld id="community" spalten={6} titel={texte.communityTitel}>
            <CommunityVergleich daten={a.community} texte={texte} sprache={sprache} />
          </Feld>
          <Feld id="schnitte" spalten={4} titel={texte.schnitteTitel} satz={texte.schnitteSatz}>
            <Schnitte daten={a.schnitte} texte={texte} noten={w.schema.noten} sprache={sprache} />
          </Feld>
        </>
      ) : null}
    </>
  );
}

/** Reihe 6: deine Bewertungen als Register mit Bildern (10). */
async function ReiheRegister({ id, register }: { id: string; register: ReturnType<typeof registerParameter> }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  const texte = w.profil;
  return (
    <Feld id="bewertungen" spalten={10} titel={texte.registerTitel} satz={texte.registerSatz}>
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
