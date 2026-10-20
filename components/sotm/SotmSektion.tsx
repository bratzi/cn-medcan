import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { SortenBild } from "@/components/medien/Bild";
import { SotmTaktImBrowser } from "@/components/sotm/SotmTaktImBrowser";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { Blatt, buttonKlassen } from "@/components/ui";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { musterBildId } from "@/lib/budpics";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { bildQuelle, blueteBild } from "@/lib/medien";
import { aktuellerSotm, type SotmAnsicht } from "@/lib/query/sotm";
import { aktiveUmfrage, type UmfrageAnsicht } from "@/lib/query/umfragen";
import { sicher } from "@/lib/sicher";
import { monatSchluessel, resttage, sotmLage } from "@/lib/sotm/kalender";

/** Monat lang ausgeschrieben, je Sprache einmal (UTC wie der Kalender). */
const MONAT_FORMAT: Record<Sprache, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
};

export function monatLang(schluessel: string, sprache: Sprache): string {
  const [jahr, monat] = schluessel.split("-").map(Number);
  return MONAT_FORMAT[sprache].format(new Date(Date.UTC(jahr, monat - 1, 1)));
}

type Ort = "startseite" | "sotm";

type Props = {
  /** "startseite": statisch, Stimmzettel im Browser; "sotm": die Seite reicht ihre Karte als children. */
  ort?: Ort;
  children?: ReactNode;
};

/** Der Strain des Monats als Karte im Buch: Bild, Name, Zahlen, ein Knopf. */
function SotmKarte({ sotm, w, sprache, gross }: { sotm: SotmAnsicht; w: Woerterbuch; sprache: Sprache; gross: boolean }) {
  const texte = w.sotm;
  const bild = bildQuelle(blueteBild(sotm.strain.bildPfad) ?? musterBildId(sotm.strain.slug));
  const { anzahl, schnitt } = sotm.mitglieder;
  const note = sotm.betreiber?.gesamtnote;

  return (
    <Blatt className={cn("grid grid-cols-1 gap-8 text-left sm:p-10", gross ? "lg:grid-cols-12 lg:items-center lg:gap-12" : "lg:grid-cols-2 lg:items-center")}>
      <div className={cn("aspect-4/5 w-full overflow-hidden border border-border bg-surface-sunken sm:aspect-square lg:aspect-4/5", gross && "lg:col-span-5")}>
        <SortenBild {...bild} breite={1280} hoehe={1280} alt={t(texte.bildAlt, { name: sotm.strain.bluete })} />
      </div>
      <div className={cn("flex min-w-0 flex-col items-start gap-4", gross && "lg:col-span-7")}>
        <h3 className={cn("font-buch text-balance text-text wrap-break-word", gross ? "text-kapitel" : "text-h1")}>{sotm.strain.bluete}</h3>
        {sotm.strain.handelsname !== sotm.strain.bluete ? (
          <p className="text-body text-text-muted wrap-break-word">{sotm.strain.handelsname}</p>
        ) : null}
        <p className="numeric text-body text-text">
          {anzahl > 0 && schnitt != null
            ? mehrzahl(sprache, texte.mitglieder, anzahl, { schnitt: formatiereZahl(schnitt, 1, sprache) })
            : texte.nochKeineBewertung}
        </p>
        {note != null ? (
          <p className="numeric text-small text-text-muted">{t(texte.betreiberNote, { note: formatiereZahl(note, 1, sprache) })}</p>
        ) : null}
        {sotm.strain.aktiv ? (
          <Link prefetch={false} href={`/blueten/${sotm.strain.slug}#bewerten`} className={buttonKlassen("primary", "md")}>
            {texte.jetztBewerten}
          </Link>
        ) : null}
      </div>
    </Blatt>
  );
}

/** Zeile zur laufenden Runde: bis wann, wie viele Tage noch. Nichts, wenn die Runde nicht zur Phase der Woche passt. */
function RestText({ umfrage, w, sprache, jetzt }: { umfrage: UmfrageAnsicht; w: Woerterbuch; sprache: Sprache; jetzt: Date }) {
  const lage = sotmLage(jetzt);
  if (umfrage.phase !== lage.phase) return null;
  const eintrag = umfrage.phase === "VORSCHLAG" ? w.sotm.rest.vorschlag : w.sotm.rest.abstimmung;
  return (
    <p className="numeric text-small text-text-muted">
      {mehrzahl(sprache, eintrag, resttage(jetzt, lage.phaseEndet), { datum: formatiereDatum(lage.phaseEndet, sprache) })}
    </p>
  );
}

async function SotmInhalt({ ort, children }: { ort: Ort; children?: ReactNode }) {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const jetzt = new Date();
  const lage = sotmLage(jetzt);
  const geladen = await sicher(
    async () => {
      const [sotm, umfrage] = await Promise.all([aktuellerSotm(jetzt), aktiveUmfrage()]);
      return { sotm, umfrage };
    },
    null,
    "Strain of the Month",
  );

  if (!geladen) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">{w.start.abstimmung.fehler}</p>
    );
  }
  const { sotm, umfrage } = geladen;
  const monat = sotm?.monat ?? monatSchluessel(jetzt);
  // Eine laufende Abstimmung kann ohne Vorschläge dastehen: dann ein Satz statt einer leeren Karte.
  const ohneVorschlag = umfrage?.phase === "ABSTIMMUNG" && umfrage.optionen.length === 0;
  const karte =
    children ?? (umfrage ? <UmfrageKarte umfrage={umfrage} zustand="im-browser" ort={ort} w={w} sprache={sprache} /> : null);

  return (
    <div className="flex flex-col gap-16">
      <SotmTaktImBrowser phaseEndet={lage.phaseEndet.toISOString()} />
      <div className="flex flex-col gap-8">
        <p className="numeric text-small text-text-muted max-lg:text-center">{monatLang(monat, sprache)}</p>
        {sotm ? (
          <SotmKarte sotm={sotm} w={w} sprache={sprache} gross={ort === "sotm"} />
        ) : (
          <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">{w.sotm.keiner}</p>
        )}
      </div>

      {umfrage ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-2 max-lg:items-center max-lg:text-center">
            <h3 className="font-buch text-h2 text-text text-balance">{w.start.abstimmung.titel}</h3>
            <p data-story="waehl-mit" className="farbverlauf font-hand text-vermerk">
              {w.start.abstimmung.waehlMit}
            </p>
            <RestText umfrage={umfrage} w={w} sprache={sprache} jetzt={jetzt} />
          </div>
          {ohneVorschlag ? <p className="text-body text-text-muted max-lg:text-center">{w.sotm.keineVorschlaege}</p> : karte}
        </div>
      ) : (
        <p className="max-w-[48ch] text-body text-text-muted">{w.start.abstimmung.keineRunde}</p>
      )}
    </div>
  );
}

/**
 * Strain of the Month samt laufender Runde (Spec 2026-10-20, Teil B, Oberfläche).
 * Auf der Startseite statisch: der Tage-Text steht beim Bauen fest, bei täglicher
 * Revalidierung genau genug; wer die Seite nach dem Phasenende sieht, stößt den Takt
 * im Browser an (SotmTaktImBrowser). Auf /sotm groß, die Karte der Runde reicht die Seite.
 */
export async function SotmSektion({ ort = "startseite", children }: Props) {
  const w = await holeWoerterbuch();
  const innen = <SotmInhalt ort={ort}>{children}</SotmInhalt>;
  return (
    <section
      id="abstimmung"
      aria-labelledby="sotm-titel"
      data-story={ort === "startseite" ? "abstimmung" : undefined}
      data-story-vorhang={ort === "startseite" ? "" : undefined}
      className={cn("relative isolate overflow-x-clip", ort === "startseite" && "px-4 py-16 sm:px-8 sm:py-24")}
    >
      <div className={cn("mx-auto flex w-full flex-col gap-8", ort === "startseite" && "max-w-240")}>
        {ort === "startseite" ? (
          <div className="flex flex-col items-start gap-4 max-lg:items-center max-lg:text-center">
            <h2 id="sotm-titel" className="font-buch text-h1 text-text text-balance">
              {w.sotm.titel}
            </h2>
            <p className="max-w-[48ch] text-body text-text-muted text-pretty">{w.sotm.satz}</p>
          </div>
        ) : (
          // Auf /sotm trägt der Seitenkopf Titel und Satz; die Überschrift bleibt für Screenreader.
          <h2 id="sotm-titel" className="sr-only">
            {w.sotm.titel}
          </h2>
        )}
        {ort === "startseite" ? (
          <Suspense fallback={<StimmzettelSkelett ansage={w.start.skelett.abstimmung} />}>{innen}</Suspense>
        ) : (
          innen
        )}
      </div>
    </section>
  );
}
