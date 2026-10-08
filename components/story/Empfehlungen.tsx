import Link from "next/link";

import { EmpfehlungenImBrowser } from "@/components/empfehlung/EmpfehlungenImBrowser";
import { Schlagwort } from "@/components/story/Schlagwort";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui";
import { holeWoerterbuch } from "@/lib/i18n";

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
      <Schlagwort satz={texte.schlagwort} oben="bottom-8 sm:bottom-12" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="empfehlungen-titel" className="font-buch text-kapitel text-text text-balance max-md:text-center">
          {texte.startVor} <em className="farbverlauf hand-betont">{texte.startBetont}</em> {texte.startNach}
        </h2>
        {/* Statische Seite (Spec 2026-10-01, statische Seiten, 4.3): die Liste holt der Browser. */}
        <EmpfehlungenImBrowser
          texte={{ startSatz: texte.startSatz, hinweis: texte.hinweis, konto: w.kopf.navigation.konto }}
          varianten={{
            laedt: <EmpfehlungenSkelett ansage={texte.laden} />,
            fehler: <p className="border border-border bg-surface-raised p-8 text-body text-text">{texte.fehler}</p>,
            gast: (
              <div className="flex flex-col items-start gap-6">
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatzGast}</p>
                <Link prefetch={false} href="/anmelden?weiter=%2F%23empfehlungen" className={buttonKlassen("primary", "md")}>
                  {texte.anmelden}
                </Link>
                <p className="text-caption text-text-muted">{texte.hinweis}</p>
              </div>
            ),
            leer: (
              <div className="flex flex-col items-start gap-6">
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.leer}</p>
                <Link prefetch={false} href="/blueten" className={buttonKlassen("secondary", "md")}>
                  {texte.zuDenBlueten}
                </Link>
              </div>
            ),
          }}
        />
      </div>
    </section>
  );
}
