import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Feld } from "@/components/kapitel/Feld";
import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilRahmen } from "@/components/profil/ProfilRahmen";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { ProfilSeitenleiste } from "@/components/profil/ProfilSeitenleiste";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { istKurzId } from "@/lib/kurz-id";
import { ansichtAus, liebsteAromen } from "@/lib/profil-ansicht";
import { netzTexte } from "@/lib/profil-oeffentlich";
import { ladeOeffentlichesProfil } from "@/lib/query/profil-oeffentlich";

/** Aus heißt sofort 404 (Spec Profil 9): kein Cache, der ein ausgeschaltetes Profil weiter zeigt. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kurzId: string }> };
type SuchParameter = Record<string, string | string[] | undefined>;

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
 * Öffentliches Profil (Spec Profil 9, Opt-in; Aufbau wie Dein Profil): Name, Avatar, Zahl und Liste der
 * freigegebenen Bewertungen und das Aroma-Netz. Nie Vorschläge oder
 * Auswertungen (privat), nie Wirkung (HWG). Ohne Einschalten 404, auch für
 * den Inhaber selbst. Eine Kurz-Id in falscher Form erreicht die Datenbank nie.
 */
export default async function OeffentlichesProfilPage({ params, searchParams }: Params & { searchParams: Promise<SuchParameter> }) {
  const { kurzId } = await params;
  if (!istKurzId(kurzId)) notFound();
  const [profil, w, sprache, parameter] = await Promise.all([
    ladeOeffentlichesProfil(kurzId),
    holeWoerterbuch(),
    holeSprache(),
    searchParams,
  ]);
  if (!profil) notFound();
  const texte = w.profilOeffentlich;
  const s = w.profil.seite;
  const werte = profil.werte;
  const netz = netzTexte(w);
  // Öffentlich nur diese zwei Ansichten; jeder andere Wert fällt auf die Übersicht.
  const sichtbar = ansichtAus(parameter.ansicht) === "bewertungen" ? "bewertungen" : "uebersicht";

  return (
    <ProfilRahmen
      seitenleiste={
        <ProfilSeitenleiste
          name={profil.anzeigename}
          avatarId={profil.avatarId}
          rolle={profil.rolle}
          seit={profil.seit}
          notizen={[{ zahl: String(profil.anzahl), wort: s.reiter.bewertungen, satz: mehrzahl(sprache, w.profil.anzahl, profil.anzahl) }]}
          aromen={werte ? liebsteAromen(werte.geschmack).map((a) => w.label.geschmack[a]) : []}
          aktionen={[]}
          texte={s}
          sprache={sprache}
          zahlenLabel={s.zahlenNeutral}
        />
      }
      reiter={
        <ProfilReiter
          basis={`/profil/${kurzId}`}
          aktiv={sichtbar}
          beschriftung={s.reiterLeiste}
          reiter={(["uebersicht", "bewertungen"] as const).map((a) => ({ ansicht: a, text: s.reiter[a] }))}
        />
      }
    >
      {sichtbar === "uebersicht" ? (
        <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel}>
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
      ) : (
        <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.bewertungenTitel}>
          <OeffentlicheBewertungen
            bewertungen={profil.bewertungen}
            anzahl={profil.anzahl}
            texte={texte}
            w={w}
            sprache={sprache}
          />
        </Feld>
      )}
    </ProfilRahmen>
  );
}
