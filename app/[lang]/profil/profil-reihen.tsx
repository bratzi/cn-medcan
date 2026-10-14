import Link from "next/link";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Feld } from "@/components/kapitel/Feld";
import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingsvertreiber } from "@/components/profil/Lieblingsvertreiber";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { Schnitte } from "@/components/profil/Schnitte";
import { TopFlop } from "@/components/profil/TopFlop";
import { buttonKlassen, textLinkKlassen } from "@/components/ui";
import { registerAnsicht, type registerParameter } from "@/lib/bewertungs-register";
import { profilHref } from "@/lib/kurz-id";
import { begruendungText } from "@/lib/empfehlung-text";
import { auswertungen, leereProfilWerte } from "@/lib/profil";
import { monatsReihe, notenVerteilung } from "@/lib/profil-dashboard";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeLieblingsvertreiber } from "@/lib/query/lieblingsvertreiber";

import { gemochtLaden, oderNull, oderUndefined, profilLaden, textLaden, zeilenLaden } from "./laden";
import { SPALTEN } from "./spalten";

/*
 * Die Profil-Reihen von /profil (Spec Profil und Konto vereint 3.2): Geschmack, Verlauf, Register,
 * Ähnliches, Vertreiber. Ohne Bewertung oder bei einem Ladefehler steht nur die Netz-Box (mit
 * Einladung beziehungsweise Fehlersatz), alle anderen Reihen rendern nichts.
 */

/** Reihe 1: Netz (7) und Top/Flop (5); ohne Bewertung das Netz allein mit Einladung, bei Fehler der Fehlersatz. */
export async function ReiheGeschmack({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  const texte = w.profil;
  if (zeilen === null || zeilen.length === 0) {
    return (
      <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} kopf={texte.koepfe.netz} ton="lila" className={SPALTEN[12]}>
        <p className={`max-w-[68ch] text-body ${zeilen === null ? "text-text" : "text-text-muted"}`}>{zeilen === null ? texte.fehler : texte.leer}</p>
        {zeilen === null ? null : (
          // Die gefüllte Primäraktion steht schon im Profilkopf: hier die zweite Stufe.
          <Link prefetch={false} href="/blueten" className={`${buttonKlassen("secondary", "md")} self-start`}>
            {texte.seite.bewerten}
          </Link>
        )}
      </Feld>
    );
  }
  const a = auswertungen(zeilen);
  return (
    <>
      <ReiheNetz id={id} className={SPALTEN[7]} />
      <Feld id="topflop" rahmen="karte" groesse="klein" titel={texte.topFlopTitel} kopf={texte.koepfe.topFlop} ton="lila" className={SPALTEN[5]}>
        <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
      </Feld>
    </>
  );
}

/** Das Aroma-Netz; die Terpene stecken seit 2026-10-09 im Netz (Schalter). */
async function ReiheNetz({ id, className }: { id: string; className?: string }) {
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
      className={className}
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

/** Reihe 2: Spur (7) und Noten (5). */
export async function ReiheVerlauf({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  return (
    <>
      <Feld
        id="aktivitaet"
        rahmen="karte"
        groesse="klein"
        titel={texte.aktivitaetTitel}
        kopf={texte.koepfe.aktivitaet}
        ton="gruen"
        satz={texte.aktivitaetSatz}
        className={SPALTEN[7]}
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
        className={SPALTEN[5]}
      >
        <NotenVerteilung stufen={notenVerteilung(zeilen)} texte={texte} />
      </Feld>
    </>
  );
}

/** Reihe 3: deine Bewertungen als Register mit Bildern, über die volle Breite. */
export async function ReiheRegister({ id, register }: { id: string; register: ReturnType<typeof registerParameter> }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  return (
    <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.registerTitel} kopf={texte.koepfe.register} ton="lila" satz={texte.registerSatz} className={SPALTEN[12]}>
      <BewertungsRegister ansicht={registerAnsicht(zeilen, register)} sortierung={register.sortierung} alle={register.alle} texte={texte} sprache={sprache} />
    </Feld>
  );
}

/** Reihe 4: Ähnliches im Aroma (bestätigte und unbestätigte Vorschläge). */
export async function ReiheAehnliches({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  // Erst das Profil, dann die Vorschläge: ein veraltetes Profil schreibt sie neu.
  await profilLaden(id);
  const empfehlungen = await ladeEmpfehlungen(id).catch(oderNull<Awaited<ReturnType<typeof ladeEmpfehlungen>>>("ladeEmpfehlungen"));
  return (
    <Feld id="aehnliches" rahmen="karte" groesse="klein" titel={texte.vorschlaegeTitel} kopf={texte.koepfe.vorschlaege} ton="gruen" className={SPALTEN[12]}>
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

/** Reihe 5: Lieblingsvertreiber über die volle Breite, darunter Schnitte (6) und Community (6). */
export async function ReiheVertreiber({ id }: { id: string }) {
  const [{ w, sprache }, zeilen, liebling] = await Promise.all([
    textLaden(),
    zeilenLaden(id),
    ladeLieblingsvertreiber(id).catch(oderUndefined<Awaited<ReturnType<typeof ladeLieblingsvertreiber>>>("ladeLieblingsvertreiber")),
  ]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  const a = auswertungen(zeilen);
  return (
    <>
      <Feld id="vertreiber" rahmen="karte" groesse="klein" titel={texte.vertreiberTitel} kopf={texte.koepfe.vertreiber} ton="lila" className={SPALTEN[12]}>
        <Lieblingsvertreiber daten={liebling} texte={texte} sprache={sprache} />
      </Feld>
      {a.schnitte ? (
        <Feld id="schnitte" rahmen="karte" groesse="klein" titel={texte.schnitteTitel} kopf={texte.koepfe.schnitte} ton="gruen" satz={texte.schnitteSatz} className={SPALTEN[6]}>
          <Schnitte daten={a.schnitte} texte={texte} noten={w.schema.noten} sprache={sprache} />
        </Feld>
      ) : null}
      <Feld
        id="community"
        rahmen="karte"
        groesse="klein"
        titel={texte.communityTitel}
        kopf={texte.koepfe.community}
        ton="lila"
        className={a.schnitte ? SPALTEN[6] : SPALTEN[12]}
      >
        <CommunityVergleich daten={a.community} texte={texte} sprache={sprache} />
      </Feld>
    </>
  );
}

/** Reihe 7b: was das Mitglied gemocht hat und wem es folgt (eigene Daten; Fremde nur mit öffentlichem Profil). */
export async function ReiheGemocht({ id }: { id: string }) {
  const [{ w }, gemocht] = await Promise.all([textLaden(), gemochtLaden(id)]);
  const texte = w.reaktionen.gemocht;
  const gruppen = gemocht
    ? [
        {
          titel: texte.bewertungen,
          leer: texte.leerBewertungen,
          zeilen: gemocht.bewertungen.map((b) => ({ key: b.id, text: b.handelsname, href: `/blueten/${b.slug}#bewertung-${b.id}` })),
        },
        {
          titel: texte.bluete,
          leer: texte.leerBluete,
          zeilen: gemocht.bluete.map((b) => ({ key: b.id, text: b.name, href: b.slug ? `/blueten/${b.slug}` : null })),
        },
        {
          titel: texte.mitglieder,
          leer: texte.leerMitglieder,
          zeilen: gemocht.mitglieder.map((m) => ({ key: m.id, text: m.name, href: profilHref(m.kurzId) })),
        },
      ]
    : [];
  return (
    <Feld id="gemocht" rahmen="karte" groesse="klein" titel={texte.titel} kopf={w.profil.koepfe.gemocht} ton="gruen" satz={texte.satz} className={SPALTEN[12]}>
      {gemocht === null ? (
        <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {gruppen.map((g) => (
            <section key={g.titel} aria-label={g.titel} className="flex min-w-0 flex-col gap-4">
              <h3 className="font-buch text-h3 text-text">{g.titel}</h3>
              {g.zeilen.length === 0 ? (
                <p className="text-body text-text-muted">{g.leer}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {g.zeilen.map((z) => (
                    <li key={z.key} className="min-w-0">
                      {z.href ? (
                        <Link prefetch={false} href={z.href} className={`${textLinkKlassen()} wrap-break-word`}>
                          {z.text}
                        </Link>
                      ) : (
                        <span className="text-body text-text wrap-break-word">{z.text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </Feld>
  );
}
