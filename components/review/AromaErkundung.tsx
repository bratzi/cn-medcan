"use client";

import { useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import type { SweetSpotZeile } from "@/components/review/SweetSpot";
import {
  BeschaffenheitsLeiste,
  type BeschaffenheitsSchluessel,
  type BeschaffenheitsWerte,
} from "@/components/review/BeschaffenheitsLeiste";
import type { KatalogEintrag } from "@/components/review/TerpenErgaenzen";
import {
  achsenIndex,
  ergaenztesTerpen,
  MAX,
  herstellerProfil,
  herstellerTreue,
  terpenStaerken,
  type KartenTerpen,
  type Treue,
} from "@/lib/aromakarte";
import { GESCHMACKS_ACHSEN, leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";

const PROZENT = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
});

/**
 * Aroma-Erkundung: alles geschieht in der Karte. Die Geschmacksbalken links
 * sind Regler; man zieht, wie stark man jede Geschmacksrichtung schmeckt,
 * und sieht als lila Serie das eigene Profil gegen die Herstellerangabe.
 * Lerneffekt: zur gezogenen Richtung leuchten die Terpene auf, die sie
 * tragen, und die Karte nennt sie. Ohne Anmeldung, speichert nichts.
 */
export function AromaErkundung({
  titel,
  terpene,
  serien,
  zeilen,
  katalog = [],
  treue = null,
  beschaffenheit,
  children,
}: {
  titel: string;
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  /** Community-Mittel je Terpen; Terpene ohne Bewertung starten im Sweet Spot. */
  zeilen: readonly SweetSpotZeile[];
  /** Alle bekannten Terpene: für Terpene, die der Hersteller nicht angibt. */
  katalog?: readonly KatalogEintrag[];
  /** Herstellertreue aus allen Bewertungen der Sorte. */
  treue?: Treue | null;
  /** Restfeuchte und Beschaffenheit, gemittelt über die Bewertungen. */
  beschaffenheit?: BeschaffenheitsWerte;
  children?: React.ReactNode;
}) {
  const [eigen, setEigen] = useState<GeschmacksMatrix | null>(null);
  const [eigeneBeschaffenheit, setEigeneBeschaffenheit] = useState<
    Partial<Record<BeschaffenheitsSchluessel, number>>
  >({});
  const bewegt = eigen !== null || Object.keys(eigeneBeschaffenheit).length > 0;

  // Karte: alle bekannten Terpene. Was der Hersteller nicht angibt, steht grau
  // daneben und wird farbig, sobald seine Geschmacksrichtung über 0 liegt.
  const angegeben = new Set(terpene.map((terpen) => terpen.name));
  const ergaenzt: KartenTerpen[] = katalog
    .filter((terpen) => !angegeben.has(terpen.name))
    .map((terpen) => ergaenztesTerpen(terpen.name, terpen.geschmack));
  const kartenTerpene = [...terpene, ...ergaenzt];
  const stufen = Object.fromEntries(
    zeilen.map((zeile) => [zeile.terpen, zeile.wert]),
  );

  const hersteller = herstellerProfil(terpene);
  const community = serien.find((serie) => serie.ton === "lila")?.matrix;
  // Start der Regler: was die Community geschmeckt hat, sonst die Herstellerangabe.
  const start = community ?? hersteller ?? leereGeschmacksMatrix();
  const werte = eigen ?? start;
  // Stärke je Terpen: Herstellerterpene leuchten nach ihrer Angabe; nicht
  // angegebene bleiben grau, bis ihre Geschmacksrichtung spürbar ist (ab 0,5),
  // kleine Community-Rauschwerte färben sie also nicht.
  const basis = terpenStaerken(kartenTerpene, stufen);
  const staerken = Object.fromEntries(
    kartenTerpene.map((terpen) => {
      if (angegeben.has(terpen.name)) return [terpen.name, basis[terpen.name] ?? 0];
      const achse = GESCHMACKS_ACHSEN[achsenIndex(terpen.geschmack)];
      const wert = achse ? werte[achse.key] : 0;
      return [terpen.name, wert < 0.5 ? 0 : Math.min(wert / MAX, 1) * 0.6];
    }),
  );
  const eigeneTreue =
    eigen && hersteller ? herstellerTreue(hersteller, eigen) : null;
  const alleSerien: AromaSerie[] = eigen
    ? [
        ...serien.filter((serie) => serie.ton === "gruen"),
        { name: "Dein Eindruck", ton: "lila", matrix: eigen },
      ]
    : [...serien];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
      {/* Die Karte ist der Mittelpunkt: füllt ihre Spalte, zentriert. */}
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <AromaKarte
          titel={titel}
          terpene={kartenTerpene}
          serien={alleSerien}
          staerken={staerken}
          ergaenzt={ergaenzt.map((terpen) => terpen.name)}
          regler={{
            werte,
            vergleich: hersteller ?? community,
            aendern: (key, wert) =>
              setEigen((alt) => ({ ...(alt ?? start), [key]: wert })),
          }}
          lernen={katalog}
        />
      </div>
      <div className="flex flex-col items-start gap-6 lg:sticky lg:top-24">
        {treue || eigeneTreue !== null ? (
          <dl className="flex flex-wrap gap-x-12 gap-y-4">
            {treue ? (
              <div className="flex flex-col gap-1">
                <dt className="text-small text-text-muted">Herstellertreue</dt>
                <dd className="numeric font-buch text-h1 font-medium text-text">
                  {PROZENT.format(treue.wert)}
                </dd>
                <dd className="text-caption text-text-muted">
                  aus {treue.anzahl}{" "}
                  {treue.anzahl === 1 ? "Bewertung" : "Bewertungen"}
                </dd>
              </div>
            ) : null}
            {eigeneTreue !== null ? (
              <div className="flex flex-col gap-1" aria-live="polite">
                <dt className="text-small text-text-muted">Dein Eindruck</dt>
                <dd className="numeric font-buch text-h1 font-medium text-kopierstift">
                  {PROZENT.format(eigeneTreue)}
                </dd>
                <dd className="text-caption text-text-muted">
                  nah an der Angabe
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <p className="-mt-2 max-w-[40ch] text-caption text-text-muted text-pretty">
          Herstellertreue: wie nah das geschmeckte Profil an dem liegt, was die
          Herstellerangaben erwarten lassen. 100 % heißt deckungsgleich.
        </p>
        <p className="max-w-[40ch] text-small text-text-muted text-pretty">
          Zieh die lila Punkte links in der Karte: Wie stark schmeckst du jede
          Richtung? Dazu leuchten die Terpene auf, die sie tragen. Hier wird
          nichts gespeichert.
        </p>
        {beschaffenheit ? (
          <BeschaffenheitsLeiste
            {...beschaffenheit}
            className="w-full"
            bedienung={{
              eigen: eigeneBeschaffenheit,
              aendern: (schluessel, wert) =>
                setEigeneBeschaffenheit((alt) => ({
                  ...alt,
                  [schluessel]: wert,
                })),
            }}
          />
        ) : null}
        {bewegt ? (
          <button
            type="button"
            onClick={() => {
              setEigen(null);
              setEigeneBeschaffenheit({});
            }}
            className="text-small text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Zurücksetzen
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
