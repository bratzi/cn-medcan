import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { NetzVerlauf } from "@/components/profil/NetzVerlauf";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { Schnitte } from "@/components/profil/Schnitte";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { TopFlop } from "@/components/profil/TopFlop";
import { Avatar, Card, CardBody, CardHeader } from "@/components/ui";
import { begruendungText } from "@/lib/empfehlung-text";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { auswertungen, leereProfilWerte } from "@/lib/profil";
import { ungeleseneAnzahl } from "@/lib/query/benachrichtigungen";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeLieblingshersteller } from "@/lib/query/lieblingshersteller";
import { aktuellesProfil, ladeAuswertungsZeilen } from "@/lib/query/profil";
import { aktuellesMitglied } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).profil.titel, robots: { index: false, follow: false } };
}

/** Fehler eines Teils reißen die Seite nicht mit (wie /mitglied); Redirects gehen durch. */
function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

/**
 * Privates Dashboard (Spec Profil 5): Netz und Terpene, bestätigte Vorschläge,
 * Top/Flop, Vergleich mit der Community, Schnitte. Profilwerte kommen
 * vorberechnet aus nutzer_profil; neu gerechnet wird nur, wenn der Stand fehlt
 * oder älter als 24 h ist (CPU-Limit 10 ms). Nur Aroma in Netz und Vorschlägen (HWG).
 */
export default async function ProfilPage() {
  const mitglied = await aktuellesMitglied();
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.profil;
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");

  // Erst das Profil: ist es veraltet, schreibt es auch die Vorschläge neu.
  const profil = await aktuellesProfil(mitglied.mitgliedId).catch(
    oderNull<Awaited<ReturnType<typeof aktuellesProfil>>>("aktuellesProfil"),
  );
  const [empfehlungen, zeilen, ungelesen, liebling] = await Promise.all([
    ladeEmpfehlungen(mitglied.mitgliedId).catch(oderNull<Awaited<ReturnType<typeof ladeEmpfehlungen>>>("ladeEmpfehlungen")),
    ladeAuswertungsZeilen(mitglied.mitgliedId).catch(
      oderNull<Awaited<ReturnType<typeof ladeAuswertungsZeilen>>>("ladeAuswertungsZeilen"),
    ),
    ungeleseneAnzahl(mitglied.mitgliedId).catch(() => 0),
    ladeLieblingshersteller(mitglied.mitgliedId).catch(
      oderNull<Awaited<ReturnType<typeof ladeLieblingshersteller>>>("ladeLieblingshersteller"),
    ),
  ]);
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
  const a = zeilen ? auswertungen(zeilen) : null;
  // Kein gespeicherter Stand, obwohl es Bewertungen gibt oder sich das nicht
  // prüfen lässt: dann nie die Leerskizze „Erste Bewertung abgeben“ zeigen.
  const netzFehlt = profil === null && (zeilen === null || zeilen.length > 0);
  const anzahl = zeilen?.length ?? profil?.werte.anzahl ?? null;

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex items-center gap-4">
        <Avatar name={mitglied.anzeigename} bildId={mitglied.avatarId} groesse="md" />
        <div>
          <h1 className="text-h1 text-text">{texte.titel}</h1>
          <p className="mt-2 text-body text-text-muted wrap-break-word">
            {mitglied.anzeigename}
            {anzahl !== null ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="numeric">{mehrzahl(sprache, texte.anzahl, anzahl)}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <ProfilReiter
        aktiv="profil"
        texte={texte}
        ungelesen={{ anzahl: ungelesen, text: mehrzahl(sprache, w.kopf.ungelesen, ungelesen) }}
      />

      <section aria-labelledby="netz-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="netz-titel" className="text-h3 text-text">
              {texte.netzTitel}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-8">
            {netzFehlt ? (
              <p className="max-w-[68ch] self-start text-body text-text">{texte.fehler}</p>
            ) : (
              <>
                {werte.anzahl > 0 ? (
                  <p className="max-w-[68ch] self-start text-body text-text-muted text-pretty">{texte.netzSatz}</p>
                ) : null}
                <ProfilNetz
                  werte={werte}
                  texte={texte}
                  achsen={w.label.geschmack}
                  sprache={sprache}
                  vorher={vorletzter?.geschmack ?? null}
                  aenderung={aenderung}
                />
                <TerpenRangliste terpene={werte.terpene} texte={texte} sprache={sprache} />
              </>
            )}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="vorschlaege-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="vorschlaege-titel" className="text-h3 text-text">
              {texte.vorschlaegeTitel}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
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
          </CardBody>
        </Card>
      </section>

      {a === null ? (
        <p className="mt-8 max-w-[68ch] text-body text-text">{texte.fehler}</p>
      ) : a.schnitte ? (
        <>
          <section aria-labelledby="topflop-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="topflop-titel" className="text-h3 text-text">
                  {texte.topFlopTitel}
                </h2>
              </CardHeader>
              <CardBody>
                <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
          <section aria-labelledby="hersteller-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="hersteller-titel" className="text-h3 text-text">
                  {texte.herstellerTitel}
                </h2>
              </CardHeader>
              <CardBody>
                <Lieblingshersteller daten={liebling} texte={texte} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
          <section aria-labelledby="community-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="community-titel" className="text-h3 text-text">
                  {texte.communityTitel}
                </h2>
              </CardHeader>
              <CardBody>
                <CommunityVergleich daten={a.community} texte={texte} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
          <section aria-labelledby="schnitte-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="schnitte-titel" className="text-h3 text-text">
                  {texte.schnitteTitel}
                </h2>
              </CardHeader>
              <CardBody>
                <Schnitte daten={a.schnitte} texte={texte} noten={w.schema.noten} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
        </>
      ) : null}

      {!netzFehlt ? (
        <section aria-labelledby="verlauf-titel" className="mt-8">
          <Card>
            <CardHeader>
              <h2 id="verlauf-titel" className="text-h3 text-text">
                {texte.verlaufTitel}
              </h2>
            </CardHeader>
            <CardBody>
              <NetzVerlauf schritte={verlauf} texte={texte} achsen={w.label.geschmack} sprache={sprache} />
            </CardBody>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
