import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Schlagwort } from "@/components/story/Schlagwort";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { buttonKlassen, einzelLinkKlassen } from "@/components/ui";
import { begruendungText } from "@/lib/empfehlung-text";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { ladeEmpfehlungen, type GespeicherteEmpfehlung } from "@/lib/query/empfehlungen";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Liste oder Teaser: Angemeldete sehen ihre vorberechnete Liste (eine Abfrage,
 * keine Rechnung je Aufruf), Gäste die Erklärung mit Anmelde-Aufruf.
 */
async function EmpfehlungenInhalt() {
  const [w, sprache, mitglied] = await Promise.all([holeWoerterbuch(), holeSprache(), aktuellesMitglied()]);
  const texte = w.empfehlung;

  if (!mitglied) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatzGast}</p>
        <Link href="/anmelden?weiter=%2F%23empfehlungen" className={buttonKlassen("primary", "md")}>
          {texte.anmelden}
        </Link>
        <p className="text-caption text-text-muted">{texte.hinweis}</p>
      </div>
    );
  }

  let liste: GespeicherteEmpfehlung[];
  try {
    liste = await ladeEmpfehlungen(mitglied.mitgliedId);
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeEmpfehlungen fehlgeschlagen", fehler);
    return <p className="border border-border bg-surface-raised p-8 text-body text-text">{texte.fehler}</p>;
  }

  if (liste.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.leer}</p>
        <Link href="/blueten" className={buttonKlassen("secondary", "md")}>
          {texte.zuDenBlueten}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatz}</p>
      <EmpfehlungsListe
        eintraege={liste.map((e) => ({ slug: e.slug, handelsname: e.handelsname, begruendung: begruendungText(e, w, sprache) }))}
      />
      <p className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="text-caption text-text-muted">{texte.hinweis}</span>
        <Link href="/mitglied" className={einzelLinkKlassen()}>
          {w.kopf.navigation.konto}
        </Link>
      </p>
    </div>
  );
}

function EmpfehlungenSkelett({ ansage }: { ansage: string }) {
  return (
    <div role="status" data-skelett="" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <SkelettAnsage text={ansage} />
      {[0, 1, 2].map((stelle) => (
        <span key={stelle} aria-hidden="true" className={`${SKELETT_FLAECHE} h-24`} />
      ))}
    </div>
  );
}

/**
 * Startseiten-Sektion „Was dir schmecken könnte“ (T11, Nutzer 2026-09-29).
 * Nur ähnliches Aroma, nie Wirkung (HWG). Buzz-Satz in Lila, weil der
 * neueste Eintrag davor Grün trägt; er hängt unten wie dort.
 */
export async function Empfehlungen() {
  const w = await holeWoerterbuch();
  const texte = w.empfehlung;
  return (
    <section
      id="empfehlungen"
      aria-labelledby="empfehlungen-titel"
      className="relative isolate scroll-mt-[calc(var(--kopf-h,4rem)+2rem)] overflow-x-clip px-4 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} oben="bottom-0 translate-y-1/2" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="empfehlungen-titel" className="font-buch text-kapitel text-text text-balance max-md:text-center">
          {texte.startVor} <em className="farbverlauf hand-betont">{texte.startBetont}</em> {texte.startNach}
        </h2>
        <Suspense fallback={<EmpfehlungenSkelett ansage={texte.laden} />}>
          <EmpfehlungenInhalt />
        </Suspense>
      </div>
    </section>
  );
}
