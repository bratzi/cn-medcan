"use client";

import { useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { NetzLegende } from "@/components/profil/NetzLegende";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import type { VerlaufSchritt } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

type Props = {
  schritte: readonly VerlaufSchritt[];
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
};

/**
 * Verlauf des Netzes (Spec Profil 10): ein Regler über die gespeicherten
 * Schritte, Start beim neuesten. Der vorige Schritt steht als dünne Kontur
 * dahinter. Keine Bewegung; nur Aroma (HWG). Der Regler nennt den Stand als
 * aria-valuetext, das SVG ist stumm.
 */
export function NetzVerlauf({ schritte, texte, achsen, sprache }: Props) {
  const [index, setIndex] = useState(schritte.length - 1);
  if (schritte.length < 2) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.verlaufLeer}</p>;

  const i = Math.min(Math.max(index, 0), schritte.length - 1);
  const schritt = schritte[i];
  const gesamt = schritte[schritte.length - 1].anzahl;
  const { mag, magNicht } = netzAusGeschmack(schritt.geschmack);
  const kontur = i > 0 ? netzAusGeschmack(schritte[i - 1].geschmack).mag : null;
  const datum = formatiereDatum(schritt.datum, sprache);
  const stand = t(texte.verlaufSchritt, { anzahl: schritt.anzahl, gesamt, datum });
  // Was sich zum vorigen Schritt geändert hat, als Text (WCAG 1.1.1): sichtbar und im aria-valuetext.
  let aenderung: string | null = null;
  if (i > 0) {
    const liste = netzAenderung(schritte[i - 1].geschmack, schritt.geschmack);
    aenderung = liste.length > 0 ? t(texte.aenderung, { datum, liste: aenderungsListe(liste, achsen, texte) }) : t(texte.aenderungGleich, { datum });
  }
  const hatMagNicht = magNicht.some((x) => x > 0);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="max-w-[68ch] self-start text-body text-text-muted text-pretty">{texte.verlaufSatz}</p>
      <NetzGrafik mag={mag} magNicht={magNicht} kontur={kontur} beschriftung={GESCHMACKS_ACHSEN.map((a) => achsen[a.enumWert])} />
      <NetzLegende mag={texte.magIch} magNicht={hatMagNicht ? texte.magIchNicht : null} vorher={kontur ? texte.vorher : null} />
      <label className="flex w-full max-w-sm flex-col gap-2">
        <span className="text-small text-text-muted">{texte.verlaufRegler}</span>
        {/* components/ui/RangeSlider hat zwei Griffe (Bereich); hier genügt ein nativer Regler. */}
        <input
          type="range"
          min={0}
          max={schritte.length - 1}
          step={1}
          value={i}
          aria-valuetext={aenderung ? `${stand}. ${aenderung}` : stand}
          onChange={(e) => setIndex(Number(e.currentTarget.value))}
          className="min-h-11 w-full accent-current"
        />
      </label>
      <p aria-hidden="true" className="text-small text-text-muted numeric">{stand}</p>
      {aenderung ? <p className="max-w-[48ch] text-center text-small text-text-muted text-pretty">{aenderung}</p> : null}
    </div>
  );
}
