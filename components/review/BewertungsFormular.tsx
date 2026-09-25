"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { bewertungSpeichern } from "@/app/bewerten/aktionen";
import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { Button, Field, Input, Meldung } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import { BeschaffenheitsRegler } from "@/components/review/BeschaffenheitsRegler";
import type { KatalogEintrag } from "@/components/review/TerpenErgaenzen";
import { ergaenztesTerpen, herstellerProfil, terpenStaerken, type KartenTerpen } from "@/lib/aromakarte";
import { MAX_NOTIZ } from "@/lib/bewertung-eingabe";
import { cn } from "@/lib/cn";
import {
  BEWERTUNGS_ACHSEN,
  GESCHMACKS_ACHSEN,
  INTENSITAETS_STUFEN,
  leereGeschmacksMatrix,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";

type Props = {
  strainId: string;
  handelsname: string;
  terpene: readonly KartenTerpen[];
  chargen: readonly string[];
  istBetreiber: boolean;
  /** Alle bekannten Terpene, zum Ergänzen. */
  katalog?: readonly KatalogEintrag[];
};

const WERT = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const REGLER =
  "h-11 w-full cursor-pointer accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Fünf Pillen als Radiogruppe: native Radios, das Aussehen trägt das Label. */
function Stufen({
  name,
  legende,
  stufen,
  sweetSpot = false,
  onWahl,
}: {
  name: string;
  legende: string;
  stufen: readonly { wert: number; label: string }[];
  sweetSpot?: boolean;
  onWahl?: (wert: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend className="text-small font-medium text-text">{legende}</legend>
      <div className="flex flex-wrap gap-2">
        {stufen.map((stufe) => (
          <label key={stufe.wert} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={stufe.wert}
              onChange={onWahl ? () => onWahl(stufe.wert) : undefined}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-11 items-center rounded-full border border-border-strong px-4 text-small text-text transition-colors duration-fast ease-standard",
                "peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
                sweetSpot && stufe.wert === 3 && "font-semibold",
              )}
            >
              {stufe.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Terpen-Stufen mit 0: bewusst nicht geschmeckt. */
const TERPEN_STUFEN = [{ wert: 0, label: "nicht geschmeckt" }, ...INTENSITAETS_STUFEN] as const;

const NOTEN_STUFEN = [1, 2, 3, 4, 5].map((wert) => ({ wert, label: String(wert) }));

/**
 * Bewertungsformular (Spec Redesign 17). Noten und Intensität als
 * Pillen-Radios, der Geschmack als Regler mit Live-Vorschau: während man
 * schiebt, zeichnet die Aroma-Karte die eigene Serie gegen die Erwartung
 * aus den Herstellerangaben. Geprüft wird in der Server Action
 * (lib/bewertung-eingabe.ts); hier steht nur Bedienhilfe.
 */
export function BewertungsFormular({ strainId, handelsname, terpene, chargen, istBetreiber, katalog = [] }: Props) {
  // Alle bekannten Terpene stehen bereit; nicht angegebene starten bei 0 (grau).
  const angegeben = new Set(terpene.map((terpen) => terpen.name));
  const dazu: KartenTerpen[] = katalog
    .filter((terpen) => !angegeben.has(terpen.name))
    .map((terpen) => ergaenztesTerpen(terpen.name, terpen.geschmack));
  const alleTerpene = [...terpene, ...dazu];
  const [gewaehlt, setGewaehlt] = useState<Record<string, number>>({});
  const stufenJeTerpen = Object.fromEntries(
    alleTerpene.map((terpen) => [terpen.name, gewaehlt[terpen.name] ?? (angegeben.has(terpen.name) ? 3 : 0)]),
  );
  const router = useRouter();
  const hydriert = useHydriert();
  const [matrix, setMatrix] = useState<GeschmacksMatrix>(leereGeschmacksMatrix);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ sofortSichtbar: boolean; slug: string } | null>(null);

  const hersteller = herstellerProfil(terpene);
  const serien: AromaSerie[] = [
    ...(hersteller ? [{ name: "Laut Hersteller", ton: "gruen" as const, matrix: hersteller }] : []),
    { name: "Deine Bewertung", ton: "lila", matrix },
  ];

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);
    const ergebnis = await bewertungSpeichern(daten);
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }
    setErfolg({ sofortSichtbar: ergebnis.sofortSichtbar, slug: ergebnis.slug });
    router.refresh();
  }

  if (erfolg) {
    return (
      <div className="flex flex-col items-start gap-6">
        <Meldung art="erfolg">
          {erfolg.sofortSichtbar
            ? "Gespeichert und veröffentlicht."
            : "Danke! Deine Bewertung ist eingegangen und erscheint nach der Freigabe."}
        </Meldung>
        <Link href={`/produkte/${erfolg.slug}`} className="text-small text-accent underline underline-offset-4">
          {`Zurück zu ${handelsname}`}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-16">
      <input type="hidden" name="strainId" value={strainId} />

      <section className="flex flex-col gap-6">
        <h2 className="font-buch text-h1 font-medium text-text">Charge</h2>
        <Input
          id="bewertung-charge"
          label="Chargennummer"
          hinweis="Steht auf der Dose. Leer lassen, wenn unbekannt."
          name="chargenNr"
          list="bewertung-chargen"
          maxLength={40}
          autoComplete="off"
        />
        <datalist id="bewertung-chargen">
          {chargen.map((nummer) => (
            <option key={nummer} value={nummer} />
          ))}
        </datalist>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-buch text-h1 font-medium text-text">Noten</h2>
        {BEWERTUNGS_ACHSEN.map((achse) => (
          <div key={achse.key} className="flex flex-col gap-1">
            <Stufen name={`note-${achse.key}`} legende={`${achse.label} (1 bis 5)`} stufen={NOTEN_STUFEN} />
            <p className="text-caption text-text-muted">{achse.erlaeuterung}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-buch text-h1 font-medium text-text">Beschaffenheit</h2>
        <p className="max-w-[60ch] text-body text-text-muted text-pretty">
          Wie die Blüte in der Hand ist. Optional, je Wert; was du nicht bewegst, bleibt unbewertet.
        </p>
        <BeschaffenheitsRegler />
      </section>

      <section className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <h2 className="font-buch text-h1 font-medium text-text">Geschmack</h2>
          {GESCHMACKS_ACHSEN.map((achse) => (
            <label key={achse.key} className="flex flex-col gap-1">
              <span className="flex justify-between text-small font-medium text-text">
                {achse.label}
                <span className="numeric text-text-muted">{WERT.format(matrix[achse.key])}</span>
              </span>
              <input
                type="range"
                name={`geschmack-${achse.key}`}
                min={0}
                max={5}
                step={0.5}
                value={matrix[achse.key]}
                onChange={(e) => setMatrix((alt) => ({ ...alt, [achse.key]: Number(e.target.value) }))}
                className={REGLER}
              />
            </label>
          ))}
        </div>
        <div className="lg:sticky lg:top-24">
          <AromaKarte
            titel="Vorschau"
            terpene={alleTerpene}
            serien={serien}
            staerken={terpenStaerken(alleTerpene, stufenJeTerpen)}
            ergaenzt={dazu.map((terpen) => terpen.name)}
          />
        </div>
      </section>

      {alleTerpene.length > 0 || katalog.length > 0 ? (
        <section className="flex flex-col gap-6">
          <h2 className="font-buch text-h1 font-medium text-text">
            Terpen-Intensität: <em className="farbverlauf hand-betont">Sweet Spot</em> gesucht
          </h2>
          <p className="max-w-[60ch] text-body text-text-muted text-pretty">
            Zu viel von einem Terpen macht den Geschmack aufdringlich, zu wenig lässt ihn flach wirken. Wie stark
            war jedes Terpen? Optional, je Terpen.
          </p>
          {terpene.map((terpen) => (
            <Stufen
              key={terpen.name}
              name={`terpen-${terpen.name}`}
              legende={terpen.name}
              stufen={TERPEN_STUFEN}
              sweetSpot
              onWahl={(wert) => setGewaehlt((alt) => ({ ...alt, [terpen.name]: wert }))}
            />
          ))}
          {dazu.length > 0 ? (
            <>
              <h3 className="mt-4 font-buch text-h3 font-medium text-text">Vom Hersteller nicht angegeben</h3>
              <p className="-mt-4 max-w-[60ch] text-small text-text-muted text-pretty">
                Steht nicht auf der Dose. Wenn du es trotzdem schmeckst, wähl eine Stufe; auf der Karte wird es dann
                farbig.
              </p>
              {dazu.map((terpen) => (
                <Stufen
                  key={terpen.name}
                  name={`terpen-${terpen.name}`}
                  legende={terpen.name}
                  stufen={TERPEN_STUFEN}
                  sweetSpot
                  onWahl={(wert) => setGewaehlt((alt) => ({ ...alt, [terpen.name]: wert }))}
                />
              ))}
            </>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-6">
        <h2 className="font-buch text-h1 font-medium text-text">Notiz</h2>
        <Field id="bewertung-notiz" label="Was ist dir aufgefallen?" hinweis={`Höchstens ${MAX_NOTIZ} Zeichen. Optional.`}>
          {(attribute) => (
            <textarea
              {...attribute}
              name="notiz"
              rows={6}
              maxLength={MAX_NOTIZ}
              className="w-full rounded-md border border-border-strong bg-surface p-4 text-body text-text"
            />
          )}
        </Field>
        {istBetreiber ? (
          <Input id="bewertung-reel" label="Instagram-Reel" hinweis="Optional." name="instagramReelUrl" type="url" inputMode="url" />
        ) : null}
      </section>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
      <div>
        <Button type="submit" disabled={!hydriert || laeuft}>
          {laeuft ? "Wird gespeichert" : istBetreiber ? "Veröffentlichen" : "Bewertung einreichen"}
        </Button>
      </div>
    </form>
  );
}
