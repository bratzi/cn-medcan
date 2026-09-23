import Link from "next/link";

import { Badge, Card, CardBody, CardFooter, CardHeader, buttonKlassen } from "@/components/ui";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { UmfrageAnsicht, UmfrageOptionAnsicht } from "@/lib/query/umfragen";
import type { UmfragePhase } from "@/db/enums";

const ZAHL_FORMATTER = new Intl.NumberFormat("de-DE");

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung läuft",
  BEENDET: "Runde beendet",
};

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

type Props = {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  className?: string;
};

function stimmenAnteil(option: UmfrageOptionAnsicht, gesamt: number): number {
  if (option.stimmen === null || gesamt <= 0) return 0;
  return Math.min(Math.max(option.stimmen / gesamt, 0), 1) * 100;
}

/**
 * Ein Kandidat.
 *
 * Gesetzte Plaetze tragen keinen Zaehler und keinen Balken: `stimmen` ist
 * dort `null` ("steht nicht zur Wahl"), nicht `0` ("niemand wollte sie").
 * Ein Balken auf 0 % wuerde genau diese falsche Aussage machen.
 */
function Kandidat({
  option,
  gesamt,
  gewaehlt,
  zeigeStimmen,
}: {
  option: UmfrageOptionAnsicht;
  gesamt: number;
  gewaehlt: boolean;
  zeigeStimmen: boolean;
}) {
  const anteil = stimmenAnteil(option, gesamt);

  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          href={`/produkte/${option.slug}`}
          className="text-body font-medium text-text underline underline-offset-2"
          title={option.handelsname}
        >
          {option.handelsname}
        </Link>

        <span className="flex items-center gap-2">
          {option.herkunft === "GESETZT" ? (
            <Badge variante="neutral" title="Vom Betreiber gesetzt, nicht zur Wahl gestellt">
              Gesetzter Platz
            </Badge>
          ) : null}
          {option.istGewinner ? <Badge variante="success">Gewinner</Badge> : null}
          {gewaehlt ? <Badge variante="accent">Deine Stimme</Badge> : null}
          {zeigeStimmen && option.stimmen !== null ? (
            <span className="numeric text-small text-text">
              {`${ZAHL_FORMATTER.format(option.stimmen)} ${option.stimmen === 1 ? "Stimme" : "Stimmen"}`}
            </span>
          ) : null}
        </span>
      </div>

      {zeigeStimmen && option.stimmen !== null ? (
        <span
          aria-hidden="true"
          className="mt-2 flex h-2 w-full overflow-hidden rounded-sm bg-surface-sunken"
        >
          <span className="block h-full rounded-sm bg-accent" style={{ width: `${anteil}%` }} />
        </span>
      ) : null}
    </li>
  );
}

/** Die Zeile unter den Kandidaten: abstimmen, oder warum nicht. */
function Aktionsbereich({ umfrage, zustand }: { umfrage: UmfrageAnsicht; zustand: StimmZustand }) {
  if (umfrage.phase === "BEENDET") {
    return (
      <p className="text-small text-text-muted">
        Diese Runde ist abgeschlossen. Das Ergebnis ist verbindlich für die nächste Bewertung.
      </p>
    );
  }

  if (umfrage.phase === "VORSCHLAG") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          Es werden noch Sorten vorgeschlagen. Die Abstimmung beginnt danach.
        </p>
        <Link href="/umfragen" className={buttonKlassen("secondary", "sm")}>
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
          Abstimmen können nur freigegebene Mitglieder.
        </p>
        <Link
          href="/anmelden?weiter=%2F"
          className={buttonKlassen("primary", "sm")}
        >
          Anmelden
        </Link>
      </div>
    );
  }

  if (zustand.art === "FREIGABE_OFFEN") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variante="warning">Freigabe ausstehend</Badge>
        <p className="text-small text-text-muted">
          Dein Konto wartet auf die manuelle Freigabe des Betreibers. Erst danach besteht
          Stimmrecht.
        </p>
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
      <p className="text-small text-text-muted">
        In dieser Runde stehen alle Plätze fest. Es gibt nichts zu wählen.
      </p>
    );
  }

  return <StimmFormular umfrageId={umfrage.id} optionen={waehlbar} />;
}

/** Die laufende Umfrage als Kernelement. Server Component. */
export function UmfrageKarte({ umfrage, zustand, className }: Props) {
  const zeigeStimmen = umfrage.phase !== "VORSCHLAG";
  // Die eigene Stimme haengt an derselben Bedingung wie die Zaehler: in der
  // Vorschlagsphase gibt es fachlich keine Stimmen, also darf dort auch kein
  // "Deine Stimme" stehen - sonst behauptet die Karte einen Zustand, den die
  // Zahlen daneben nicht zeigen.
  const gewaehlteOption =
    zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;

  const frist = umfrage.phase === "VORSCHLAG" ? umfrage.vorschlagBisAm : umfrage.endetAm;
  const fristLabel = umfrage.phase === "VORSCHLAG" ? "Vorschläge bis" : "Abstimmung bis";

  return (
    <Card className={cn("border-accent", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
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
      </CardHeader>

      <CardBody>
        <h2 className="max-w-[68ch] text-h2 text-text">{umfrage.titel}</h2>
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
      </CardBody>

      <CardFooter>
        <Aktionsbereich umfrage={umfrage} zustand={zustand} />
      </CardFooter>
    </Card>
  );
}
