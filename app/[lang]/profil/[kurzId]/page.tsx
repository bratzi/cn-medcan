import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EigeneLikes } from "@/components/reaktionen/EigeneLikes";
import { Kommentare } from "@/components/reaktionen/Kommentare";
import { LikeKnopf } from "@/components/reaktionen/LikeKnopf";
import { Feld } from "@/components/kapitel/Feld";
import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilKopf } from "@/components/profil/ProfilKopf";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { istKurzId } from "@/lib/kurz-id";
import { liebsteAromen } from "@/lib/profil-ansicht";
import { netzTexte } from "@/lib/profil-oeffentlich";
import { ladeOeffentlichesProfil } from "@/lib/query/profil-oeffentlich";
import { ladeKommentare } from "@/lib/query/kommentare";
import { reaktionenFuer } from "@/lib/query/reaktionen";

import { SPALTEN } from "../spalten";

/** Aus heißt sofort 404 (Spec Profil 9): kein Cache, der ein ausgeschaltetes Profil weiter zeigt. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kurzId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { kurzId } = await params;
  const w = await holeWoerterbuch();
  const profil = istKurzId(kurzId) ? await ladeOeffentlichesProfil(kurzId).catch(() => null) : null;
  return {
    title: profil ? t(w.profilOeffentlich.titel, { name: profil.anzeigename }) : w.fehlerseite.nichtGefunden,
    robots: { index: false, follow: false },
  };
}

/**
 * Öffentliches Profil (Spec Profil 9, Opt-in; Aufbau wie Mein Profil: Profilkopf, darunter Netz und Bewertungen): Name, Avatar, Zahl und Liste der
 * freigegebenen Bewertungen und das Aroma-Netz. Nie Vorschläge oder
 * Auswertungen (privat), nie Wirkung (HWG). Ohne Einschalten 404, auch für
 * den Inhaber selbst. Eine Kurz-Id in falscher Form erreicht die Datenbank nie.
 */
export default async function OeffentlichesProfilPage({ params }: Params) {
  const { kurzId } = await params;
  if (!istKurzId(kurzId)) notFound();
  const [profil, w, sprache] = await Promise.all([ladeOeffentlichesProfil(kurzId), holeWoerterbuch(), holeSprache()]);
  if (!profil) notFound();
  // Folgende und Kommentare der Pinnwand aus demselben Zähler (eine Abfrage); ob ich folge, lädt die Insel nach.
  const zaehler = (await reaktionenFuer("MITGLIED", [profil.id])).get(profil.id);
  const folgende = zaehler?.likes ?? 0;
  const pinnwandZahl = zaehler?.kommentare ?? 0;
  // Die Seite ist ohnehin dynamisch: die erste Seite Kommentare steht gleich da. Ein Fehler lässt sie auf Abruf laden.
  const pinnwand = await ladeKommentare("PROFIL", profil.id).catch((fehler: unknown) => {
    console.error("ladeKommentare fehlgeschlagen", fehler);
    return undefined;
  });
  const texte = w.profilOeffentlich;
  const s = w.profil.seite;
  const werte = profil.werte;
  const netz = netzTexte(w);

  return (
    <EigeneLikes>
    <div className="pb-16">
      <ProfilKopf
        name={profil.anzeigename}
        avatarId={profil.avatarId}
        rolle={profil.rolle}
        seit={profil.seit}
        gruppen={[{ titel: s.zahlenNeutral, notizen: [{ zahl: String(profil.anzahl), wort: s.reiter.bewertungen, satz: mehrzahl(sprache, w.profil.anzahl, profil.anzahl), href: "#bewertungen-titel" }] }]}
        aromen={werte ? liebsteAromen(werte.geschmack).map((a) => w.label.geschmack[a]) : []}
        aktionen={[]}
        folgen={<LikeKnopf art="MITGLIED" zielId={profil.id} anzahl={folgende} text={w.reaktionen.knopf} />}
        texte={s}
        sprache={sprache}
      />
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 pt-8 sm:px-8 min-[1080px]:pt-12 min-[1280px]:grid-cols-12">
        <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} className={SPALTEN[12]}>
          <div className="flex flex-col items-center gap-8">
            {/* Nur mit Bewertungen: die Leerskizze von ProfilNetz trägt den Knopf „Erste Bewertung abgeben“, der gehört nicht auf fremde Profile. */}
            {werte && werte.anzahl > 0 ? (
              <>
                <p className="max-w-[68ch] self-start text-body text-text-muted text-pretty">
                  {t(texte.netzSatz, { name: profil.anzeigename })}
                </p>
                <ProfilNetz werte={werte} texte={netz} achsen={w.label.geschmack} sprache={sprache} />
              </>
            ) : (
              <p className="self-start text-body text-text-muted">{texte.netzLeer}</p>
            )}
          </div>
        </Feld>
        <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.bewertungenTitel} className={SPALTEN[12]}>
          <OeffentlicheBewertungen
            bewertungen={profil.bewertungen}
            anzahl={profil.anzahl}
            texte={texte}
            w={w}
            sprache={sprache}
          />
        </Feld>
        <Feld id="pinnwand" rahmen="karte" groesse="klein" titel={w.reaktionen.kommentare.pinnwand} className={SPALTEN[12]}>
          {/* Nur bei profilOeffentlich: sonst 404 oben. */}
          <Kommentare
            ziel="PROFIL"
            zielId={profil.id}
            anzahl={pinnwandZahl}
            text={w.reaktionen.kommentare}
            sprache={sprache}
            start={pinnwand}
            offen={Boolean(pinnwand)}
          />
        </Feld>
      </div>
    </div>
    </EigeneLikes>
  );
}
