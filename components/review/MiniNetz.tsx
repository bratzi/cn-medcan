"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { ausklingen, NETZ_DAUER_MS, startFortschritt, zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";

type Props = {
  vorher: Geschmack | null;
  nachher: Geschmack;
  texte: Woerterbuch["bewerten"];
  achsen: Woerterbuch["label"]["geschmack"];
};

const null10 = () => Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Geschmack;

/**
 * Mini-Netz nach dem Speichern (Spec Profil 2.12): das eigene Netz wächst von
 * vorher nach jetzt, die Kontur zeigt den alten Stand. Reduzierte Bewegung:
 * sofort der neue Stand. Die Änderung steht als Text, das SVG ist stumm.
 * Nur Aroma, kein Kauf- oder Apothekenlink (HWG).
 */
export function MiniNetz({ vorher, nachher, texte, achsen }: Props) {
  const start = vorher ?? null10();
  const [fortschritt, setFortschritt] = useState(0);

  useEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rahmen = 0;
    if (startFortschritt(reduziert) === 1) {
      // Im Rahmen-Callback statt im Effekt-Körper, damit kein synchroner setState entsteht.
      rahmen = requestAnimationFrame(() => setFortschritt(1));
      return () => cancelAnimationFrame(rahmen);
    }
    const beginn = performance.now();
    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - beginn) / NETZ_DAUER_MS);
      setFortschritt(ausklingen(t));
      if (t < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [vorher, nachher]);

  const { mag, magNicht } = netzAusGeschmack(zwischenGeschmack(start, nachher, fortschritt));
  const kontur = vorher ? netzAusGeschmack(vorher).mag : null;
  const aenderung = netzAenderung(start, nachher);
  const satz =
    aenderung.length > 0
      ? t(texte.miniNetzAenderung, { liste: aenderungsListe(aenderung, achsen, { staerker: texte.miniStaerker, schwaecher: texte.miniSchwaecher }) })
      : texte.miniNetzGleich;

  return (
    <section aria-labelledby="mini-netz-titel" className="flex flex-col items-center gap-4 text-text">
      <h3 id="mini-netz-titel" className="self-start text-h3 text-text">{texte.miniNetzTitel}</h3>
      <NetzGrafik mag={mag} magNicht={magNicht} kontur={kontur} className="w-full max-w-48" />
      {kontur ? (
        <ul className="flex gap-6 text-small text-text-muted">
          <li className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6">
              <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
            </svg>
            {texte.miniNetzVorher}
          </li>
          <li className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6">
              <rect width="24" height="8" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} />
            </svg>
            {texte.miniNetzJetzt}
          </li>
        </ul>
      ) : null}
      <p className="max-w-[48ch] text-center text-body text-text-muted text-pretty">{satz}</p>
      <Link
        prefetch={false}
        href="/profil"
        className="inline-flex min-h-11 items-center text-small text-accent underline underline-offset-4 hover:text-accent-hover"
      >
        {texte.miniNetzLink}
      </Link>
    </section>
  );
}
