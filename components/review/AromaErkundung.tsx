"use client";

import { useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { SweetSpot, type SweetSpotZeile } from "@/components/review/SweetSpot";
import { achsenIndex, eindruckProfil, type KartenTerpen } from "@/lib/aromakarte";

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
  children,
}: {
  titel: string;
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  /** Community-Mittel je Terpen; Terpene ohne Bewertung starten im Sweet Spot. */
  zeilen: readonly SweetSpotZeile[];
  intensitaetTitel?: string;
  children?: React.ReactNode;
}) {
  const alle: SweetSpotZeile[] = terpene.map(
    (terpen) => zeilen.find((zeile) => zeile.terpen === terpen.name) ?? { terpen: terpen.name, wert: 3 },
  );
  const [eigen, setEigen] = useState<Record<string, number>>({});
  const [aktiv, setAktiv] = useState<number | null>(null);

  const bewegt = Object.keys(eigen).length > 0;
  const eindruck = bewegt
    ? eindruckProfil(terpene, Object.fromEntries(alle.map((zeile) => [zeile.terpen, eigen[zeile.terpen] ?? zeile.wert])))
    : null;
  const alleSerien: AromaSerie[] = eindruck
    ? [...serien.filter((serie) => serie.ton === "gruen"), { name: "Dein Eindruck", ton: "lila", matrix: eindruck }]
    : [...serien];

  const aktivieren = (name: string | null) => {
    const terpen = name ? terpene.find((t) => t.name === name) : undefined;
    setAktiv(terpen ? achsenIndex(terpen.geschmack) : null);
  };

  return (
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <AromaKarte titel={titel} terpene={terpene} serien={alleSerien} hervorheben={aktiv} />
      </div>
      <div className="flex flex-col items-start gap-8">
        <SweetSpot
          titel={intensitaetTitel}
          zeilen={alle}
          bedienung={{
            eigen,
            aendern: (terpen, wert) => setEigen((alt) => ({ ...alt, [terpen]: wert })),
            aktivieren,
          }}
        />
        <p className="max-w-[48ch] text-small text-text-muted text-pretty">
          Schieb die Punkte: Wie stark hast du die Terpene geschmeckt? Die Karte zeigt dein Profil in Lila. Hier wird
          nichts gespeichert.
        </p>
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
  );
}
