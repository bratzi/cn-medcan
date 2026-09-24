import Link from "next/link";

import { Textur } from "@/components/medien/Textur";
import { Badge, buttonKlassen } from "@/components/ui";
import { namenLinkKlassen } from "@/components/ui/textlink";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { PHASEN_LABEL } from "@/components/umfrage/phasen";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { UmfrageAnsicht, UmfrageOptionAnsicht } from "@/lib/query/umfragen";

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

function stimmenAnteil(option: UmfrageOptionAnsicht, gesamt: number): number {
  if (option.stimmen === null || gesamt <= 0) return 0;
  return Math.min(Math.max(option.stimmen / gesamt, 0), 1) * 100;
}

/**
 * Ein Kandidat. Auf dem Stimmzettel spricht das Buch: Handelsnamen in
 * Cormorant (Brand Guideline 10). Gesetzte Plaetze tragen keinen Zaehler
 * und keinen Balken: `stimmen` ist dort `null` ("steht nicht zur Wahl"),
 * nicht `0` ("niemand wollte sie").
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
  const name = (
    <Link
      href={`/produkte/${option.slug}`}
      className={namenLinkKlassen("min-w-0 font-buch text-h3 font-medium wrap-break-word")}
      title={option.handelsname}
    >
      {option.handelsname}
    </Link>
  );

  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {option.herkunft === "COMMUNITY" ? (
          <span className="relative isolate inline-block min-w-0">
            <Textur id="nebel" story="spruehmarke" weich className="absolute -inset-x-4 -inset-y-2 -z-10 opacity-40" />
            {name}
          </span>
        ) : (
          name
        )}

        <span className="flex items-center gap-2">
          {option.herkunft === "GESETZT" ? (
            <span className="stempel" title="Von mir gesetzt, nicht zur Wahl gestellt">
              Gesetzt
            </span>
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
        <span aria-hidden="true" className="mt-2 flex h-2 w-full overflow-hidden bg-surface-sunken">
          {/* Datengrafik in Tinte, nicht in Blattgruen: Gruen ist Bedienung. */}
          <span className="block h-full bg-text" style={{ width: `${stimmenAnteil(option, gesamt)}%` }} />
        </span>
      ) : null}
    </li>
  );
}

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
        Diese Runde ist abgeschlossen. Das Ergebnis ist verbindlich für meine nächste Bewertung.
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
        <p className="text-small text-text-muted">Sobald ich dein Konto freischalte, kannst du abstimmen.</p>
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
 * Die laufende Runde als Stimmzettel an der Wand (Spec TP2 4.2), auf der
 * Startseite und auf /umfragen gleich. Gesetzte Plaetze gestempelt, waehlbare
 * gespruht markiert. Server Component.
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
