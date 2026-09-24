import Link from "next/link";

import { Badge, buttonKlassen } from "@/components/ui";
import { Kandidat } from "@/components/umfrage/Kandidat";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { PHASEN_LABEL } from "@/components/umfrage/phasen";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

const ZAHL_FORMATTER = new Intl.NumberFormat("de-DE");

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
};

/** Die Zeile unter den Kandidaten: abstimmen, oder warum nicht. */
function Aktionsbereich({
  umfrage,
  zustand,
  ort,
}: {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  ort: StimmzettelOrt;
}) {
  if (umfrage.phase === "BEENDET") {
    return (
      <p className="text-small text-text-muted">
        Diese Runde ist abgeschlossen. Das Ergebnis ist verbindlich für unsere nächste Bewertung.
      </p>
    );
  }

  if (umfrage.phase === "VORSCHLAG") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          Es werden noch Sorten vorgeschlagen. Die Abstimmung beginnt danach.
        </p>
        <Link href={ZIELE[ort].vorschlagen} className={buttonKlassen("secondary", "md")}>
          Sorte vorschlagen
        </Link>
      </div>
    );
  }

  // Ab hier: ABSTIMMUNG.
  if (zustand.art === "ANONYM") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          Abstimmen kannst du, sobald du angemeldet und freigeschaltet bist.
        </p>
        <Link href={ZIELE[ort].anmelden} className={buttonKlassen("primary", "md")}>
          Anmelden
        </Link>
      </div>
    );
  }

  if (zustand.art === "FREIGABE_OFFEN") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variante="warning">Noch nicht freigeschaltet</Badge>
        <p className="text-small text-text-muted">Sobald dein Konto freigeschaltet ist, kannst du abstimmen.</p>
      </div>
    );
  }

  if (zustand.art === "ABGESTIMMT") {
    return (
      <p role="status" className="text-small text-text">
        <span className="font-medium">Deine Stimme ist gezählt. </span>
        <span className="text-text-muted">Eine Änderung ist nicht vorgesehen.</span>
      </p>
    );
  }

  const waehlbar = umfrage.optionen.filter((option) => option.herkunft === "COMMUNITY");
  if (waehlbar.length === 0) {
    return (
      <p className="text-small text-text-muted">In dieser Runde stehen alle Plätze fest. Es gibt nichts zu wählen.</p>
    );
  }

  return <StimmFormular umfrageId={umfrage.id} optionen={waehlbar} />;
}

/**
 * Die laufende Runde als Stimmzettel im Buch (Spec TP2 4.2, Spec TP3 8.6),
 * auf der Startseite und auf /umfragen gleich. Gesetzte Plätze gestempelt,
 * Community-Plätze von Hand vermerkt (Kandidat.tsx). Server Component.
 */
export function UmfrageKarte({ umfrage, zustand, className, ort = "startseite" }: Props) {
  const zeigeStimmen = umfrage.phase !== "VORSCHLAG";
  // Die eigene Stimme haengt an derselben Bedingung wie die Zaehler: in der
  // Vorschlagsphase gibt es fachlich keine Stimmen, also darf dort auch kein
  // "Deine Stimme" stehen.
  const gewaehlteOption = zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;

  const frist = umfrage.phase === "VORSCHLAG" ? umfrage.vorschlagBisAm : umfrage.endetAm;
  const fristLabel = umfrage.phase === "VORSCHLAG" ? "Vorschläge bis" : "Abstimmung bis";

  return (
    <div className={cn("stimmzettel border border-border-strong bg-surface-raised shadow-md", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <Badge variante="accent">{PHASEN_LABEL[umfrage.phase]}</Badge>
        {frist && umfrage.phase !== "BEENDET" ? (
          <p className="text-small text-text-muted">
            {`${fristLabel} `}
            <time dateTime={frist.toISOString()} className="font-medium text-text">
              {formatiereDatum(frist)}
            </time>
            {` (${formatiereRelativ(frist)})`}
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
            />
          ))}
        </ul>

        {zeigeStimmen ? (
          <p className="numeric mt-8 text-small text-text-muted">
            {`${ZAHL_FORMATTER.format(umfrage.stimmenGesamt)} ${umfrage.stimmenGesamt === 1 ? "abgegebene Stimme" : "abgegebene Stimmen"}`}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border bg-surface-raised px-6 py-4">
        <Aktionsbereich umfrage={umfrage} zustand={zustand} ort={ort} />
      </div>
    </div>
  );
}
