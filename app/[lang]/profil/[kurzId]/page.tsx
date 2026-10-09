import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { Avatar, Card, CardBody, CardHeader } from "@/components/ui";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { istKurzId } from "@/lib/kurz-id";
import { netzTexte } from "@/lib/profil-oeffentlich";
import { ladeOeffentlichesProfil } from "@/lib/query/profil-oeffentlich";

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
 * Öffentliches Profil (Spec Profil 9, Opt-in): Name, Avatar, Zahl und Liste der
 * freigegebenen Bewertungen und das Aroma-Netz. Nie Vorschläge oder
 * Auswertungen (privat), nie Wirkung (HWG). Ohne Einschalten 404, auch für
 * den Inhaber selbst. Eine Kurz-Id in falscher Form erreicht die Datenbank nie.
 */
export default async function OeffentlichesProfilPage({ params }: Params) {
  const { kurzId } = await params;
  if (!istKurzId(kurzId)) notFound();
  const [profil, w, sprache] = await Promise.all([ladeOeffentlichesProfil(kurzId), holeWoerterbuch(), holeSprache()]);
  if (!profil) notFound();
  const texte = w.profilOeffentlich;
  const werte = profil.werte;
  const netz = netzTexte(w);

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex items-center gap-4">
        <Avatar name={profil.anzeigename} bildId={profil.avatarId} groesse="md" />
        <div className="min-w-0">
          <h1 className="text-h1 text-text text-balance wrap-break-word">{profil.anzeigename}</h1>
          <p className="mt-2 text-body text-text-muted numeric">{mehrzahl(sprache, w.profil.anzahl, profil.anzahl)}</p>
        </div>
      </div>

      <section aria-labelledby="netz-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="netz-titel" className="text-h3 text-text">
              {texte.netzTitel}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-8">
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
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="bewertungen-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="bewertungen-titel" className="text-h3 text-text">
              {texte.bewertungenTitel}
            </h2>
          </CardHeader>
          <CardBody>
            <OeffentlicheBewertungen
              bewertungen={profil.bewertungen}
              anzahl={profil.anzahl}
              texte={texte}
              w={w}
              sprache={sprache}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
