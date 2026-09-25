"use client";

import { useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { SweetSpot, type SweetSpotZeile } from "@/components/review/SweetSpot";
import {
  BeschaffenheitsLeiste,
  type BeschaffenheitsWerte,
} from "@/components/review/BeschaffenheitsLeiste";
import type { KatalogEintrag } from "@/components/review/TerpenErgaenzen";
import {
  achsenIndex,
  eindruckProfil,
  ergaenztesTerpen,
  herstellerProfil,
  herstellerTreue,
  terpenStaerken,
  type KartenTerpen,
  type Treue,
} from "@/lib/aromakarte";

const PROZENT = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
});

/**
 * Aroma-Karte und Sweet Spot in einem (Spec Redesign 20, zusammengeführt):
 * die Sweet-Spot-Spuren sind zugleich die Regler. Wer ein Terpen stärker
 * oder schwächer stellt, sieht auf der Karte als dritte Serie, wie sich das
 * Profil verschiebt; die Achse des bewegten Terpens tritt hervor. Ohne
 * Anmeldung, speichert nichts.
 */
export function AromaErkundung({
  titel,
  terpene,
  serien,
  zeilen,
  intensitaetTitel,
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
  intensitaetTitel?: string;
  /** Alle bekannten Terpene: für Terpene, die der Hersteller nicht angibt. */
  katalog?: readonly KatalogEintrag[];
  /** Herstellertreue aus allen Bewertungen der Sorte. */
  treue?: Treue | null;
  /** Restfeuchte und Beschaffenheit, gemittelt über die Bewertungen. */
  beschaffenheit?: BeschaffenheitsWerte;
  children?: React.ReactNode;
}) {
  const [eigen, setEigen] = useState<Record<string, number>>({});

  // Alle bekannten Terpene stehen bereit. Was der Hersteller nicht angibt,
  // startet bei 0 (grau), außer die Community hat es schon geschmeckt.
  const angegeben = new Set(terpene.map((terpen) => terpen.name));
  const ergaenztNamen = [
    ...new Set([
      ...zeilen
        .map((zeile) => zeile.terpen)
        .filter((name) => !angegeben.has(name)),
      ...katalog
        .map((terpen) => terpen.name)
        .filter((name) => !angegeben.has(name)),
    ]),
  ];
  const ergaenzt: KartenTerpen[] = ergaenztNamen.flatMap((name) => {
    const eintrag = katalog.find((terpen) => terpen.name === name);
    return eintrag ? [ergaenztesTerpen(eintrag.name, eintrag.geschmack)] : [];
  });
  const kartenTerpene = [...terpene, ...ergaenzt];
  const alle: SweetSpotZeile[] = kartenTerpene.map((terpen) => ({
    ...(zeilen.find((zeile) => zeile.terpen === terpen.name) ?? {
      terpen: terpen.name,
      wert: angegeben.has(terpen.name) ? 3 : 0,
    }),
    ergaenzt: !angegeben.has(terpen.name),
  }));
  const [aktiv, setAktiv] = useState<number | null>(null);

  const bewegt = Object.keys(eigen).length > 0;
  const stufen = Object.fromEntries(
    alle.map((zeile) => [zeile.terpen, eigen[zeile.terpen] ?? zeile.wert]),
  );
  const eindruck = bewegt ? eindruckProfil(terpene, stufen, ergaenzt) : null;
  const hersteller = herstellerProfil(terpene);
  const eigeneTreue =
    eindruck && hersteller ? herstellerTreue(hersteller, eindruck) : null;
  const alleSerien: AromaSerie[] = eindruck
    ? [
        ...serien.filter((serie) => serie.ton === "gruen"),
        { name: "Dein Eindruck", ton: "lila", matrix: eindruck },
      ]
    : [...serien];

  const aktivieren = (name: string | null) => {
    const terpen = name
      ? kartenTerpene.find((t) => t.name === name)
      : undefined;
    setAktiv(terpen ? achsenIndex(terpen.geschmack) : null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
        {/* Links Karte und Regler direkt darunter: man sieht beim Schieben, was sich tut. */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Die Karte ist der Mittelpunkt: füllt ihre Spalte, zentriert. */}
          <div className="mx-auto w-full max-w-3xl">
            <AromaKarte
              titel={titel}
              terpene={kartenTerpene}
              serien={alleSerien}
              hervorheben={aktiv}
              staerken={terpenStaerken(kartenTerpene, stufen)}
              ergaenzt={ergaenzt.map((terpen) => terpen.name)}
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-24">
          {treue || eigeneTreue !== null ? (
            <dl className="flex flex-wrap gap-x-12 gap-y-4">
              {treue ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-small text-text-muted">
                    Herstellertreue
                  </dt>
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
            Herstellertreue: wie nah das geschmeckte Profil an dem liegt, was
            die Herstellerangaben erwarten lassen. 100 % heißt deckungsgleich.
          </p>
          <p className="max-w-[40ch] text-small text-text-muted text-pretty">
            Schieb die Punkte: Wie stark hast du die Terpene geschmeckt? Terpene
            bei 0 bleiben grau, hochgezogen werden sie farbig. Die Karte zeigt
            dein Profil in Lila. Hier wird nichts gespeichert.
          </p>
          {beschaffenheit ? (
            <BeschaffenheitsLeiste {...beschaffenheit} className="w-full" />
          ) : null}
          {bewegt ? (
            <button
              type="button"
              onClick={() => setEigen({})}
              className="text-small text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              Zurücksetzen
            </button>
          ) : null}
          {children}
        </div>
      </div>
      <SweetSpot
        titel={intensitaetTitel}
        zeilen={alle}
        quer
        bedienung={{
          eigen,
          aendern: (terpen, wert) =>
            setEigen((alt) => ({ ...alt, [terpen]: wert })),
          aktivieren,
        }}
      />
    </div>
  );
}
