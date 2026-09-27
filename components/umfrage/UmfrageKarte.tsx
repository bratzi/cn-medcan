import Link from "next/link";

import { Badge, buttonKlassen } from "@/components/ui";
import { Kandidat } from "@/components/umfrage/Kandidat";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { phasenLabel } from "@/components/umfrage/phasen";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { mehrzahl } from "@/lib/i18n/text";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

/**
 * Der Zustand des Betrachters gegenueber dieser Runde.
 *
 * Er wird von der Seite aus `lib/session.ts` bestimmt und hier nur
 * angezeigt. Die Komponente entscheidet ueber keine Berechtigung - das tut
 * die Server Action, und zwar noch einmal.
 */
export type StimmZustand =
  | { art: "ANONYM" }
  | { art: "FREIGABE_OFFEN" }
  | { art: "STIMMBERECHTIGT" }
  | { art: "ABGESTIMMT"; optionId: string };

/** Wo der Stimmzettel steht: bestimmt nur die Ziele der Links. */
export type StimmzettelOrt = "startseite" | "umfragen";

const ZIELE: Record<StimmzettelOrt, { anmelden: string; vorschlagen: string }> = {
  startseite: { anmelden: "/anmelden?weiter=%2F", vorschlagen: "/umfragen#vorschlaege" },
  umfragen: { anmelden: "/anmelden?weiter=%2Fumfragen", vorschlagen: "#vorschlaege" },
};

type Props = {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  className?: string;
  ort?: StimmzettelOrt;
  w: Woerterbuch;
  sprache: Sprache;
};

/** Die Zeile unter den Kandidaten: abstimmen, oder warum nicht. */
function Aktionsbereich({
  umfrage,
  zustand,
  ort,
  w,
}: {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  ort: StimmzettelOrt;
  w: Woerterbuch;
}) {
  const texte = w.umfrage.karte;
  if (umfrage.phase === "BEENDET") {
    return (
      <p className="text-small text-text-muted">
        {texte.abgeschlossen}
      </p>
    );
  }

  if (umfrage.phase === "VORSCHLAG") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          {texte.vorschlagsphase}
        </p>
        <Link href={ZIELE[ort].vorschlagen} className={buttonKlassen("secondary", "md")}>
          {texte.sorteVorschlagen}
        </Link>
      </div>
    );
  }

  // Ab hier: ABSTIMMUNG.
  if (zustand.art === "ANONYM") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          {texte.anonym}
        </p>
        <Link href={ZIELE[ort].anmelden} className={buttonKlassen("primary", "md")}>
          {w.umfrage.anmelden}
        </Link>
      </div>
    );
  }

  if (zustand.art === "FREIGABE_OFFEN") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variante="warning">{texte.nichtFreigeschaltet}</Badge>
        <p className="text-small text-text-muted">{texte.freigabe}</p>
      </div>
    );
  }

  if (zustand.art === "ABGESTIMMT") {
    return (
      <p role="status" className="text-small text-text">
        <span className="font-medium">{texte.gezaehlt} </span>
        <span className="text-text-muted">{texte.keineAenderung}</span>
      </p>
    );
  }

  const waehlbar = umfrage.optionen.filter((option) => option.herkunft === "COMMUNITY");
  if (waehlbar.length === 0) {
    return (
      <p className="text-small text-text-muted">{texte.allesFest}</p>
    );
  }

  return <StimmFormular umfrageId={umfrage.id} optionen={waehlbar} texte={w.umfrage.stimmFormular} />;
}

/**
 * Die laufende Runde als Stimmzettel im Buch (Spec TP2 4.2, Spec TP3 8.6),
 * auf der Startseite und auf /umfragen gleich. Gesetzte Plätze gestempelt,
 * Community-Plätze von Hand vermerkt (Kandidat.tsx). Server Component.
 */
export function UmfrageKarte({ umfrage, zustand, className, ort = "startseite", w, sprache }: Props) {
  const texte = w.umfrage.karte;
  const zeigeStimmen = umfrage.phase !== "VORSCHLAG";
  // Die eigene Stimme haengt an derselben Bedingung wie die Zaehler: in der
  // Vorschlagsphase gibt es fachlich keine Stimmen, also darf dort auch kein
  // "Deine Stimme" stehen.
  const gewaehlteOption = zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;

  const frist = umfrage.phase === "VORSCHLAG" ? umfrage.vorschlagBisAm : umfrage.endetAm;
  const fristLabel = umfrage.phase === "VORSCHLAG" ? texte.fristVorschlag : texte.fristAbstimmung;

  return (
    <div className={cn("stimmzettel border border-border-strong bg-surface-raised shadow-md", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <Badge variante="accent">{phasenLabel(w, umfrage.phase)}</Badge>
        {frist && umfrage.phase !== "BEENDET" ? (
          <p className="text-small text-text-muted">
            {`${fristLabel} `}
            <time dateTime={frist.toISOString()} className="font-medium text-text">
              {formatiereDatum(frist, sprache)}
            </time>
            {` (${formatiereRelativ(frist, undefined, sprache)})`}
          </p>
        ) : null}
      </div>

      <div className="px-6 py-6">
        <h3 className="max-w-[68ch] text-h2 text-text">{umfrage.titel}</h3>
        {umfrage.beschreibung ? (
          <p className="mt-4 max-w-[68ch] text-body text-text-muted">{umfrage.beschreibung}</p>
        ) : null}

        <ul className="mt-8 flex flex-col">
          {umfrage.optionen.map((option) => (
            <Kandidat
              key={option.id}
              option={option}
              gesamt={umfrage.stimmenGesamt}
              gewaehlt={option.id === gewaehlteOption}
              zeigeStimmen={zeigeStimmen}
              texte={w.umfrage.kandidat}
              sprache={sprache}
            />
          ))}
        </ul>

        {zeigeStimmen ? (
          <p className="numeric mt-8 text-small text-text-muted">
            {mehrzahl(sprache, texte.abgegeben, umfrage.stimmenGesamt)}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border bg-surface-raised px-6 py-4">
        <Aktionsbereich umfrage={umfrage} zustand={zustand} ort={ort} w={w} />
      </div>
    </div>
  );
}
