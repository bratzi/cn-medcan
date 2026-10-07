"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { NetzLegende } from "@/components/profil/NetzLegende";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { ausklingen, NETZ_DAUER_MS, startFortschritt, zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";

type Props = {
  vorher: Geschmack | null;
  nachher: Geschmack;
  /** Hat die Note das Netz geformt (ab 3,5 oder bis 2)? Steuert den Satz, wenn sich nichts sichtbar ändert. */
  geformt: boolean;
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
export function MiniNetz({ vorher, nachher, geformt, texte, achsen }: Props) {
  const start = vorher ?? null10();
  // Bei reduzierter Bewegung gleich der neue Stand, kein Frame mit dem alten. Die Komponente mountet
  // nur im Client nach einer Interaktion; auf dem Server (Test) gilt 0.
  const [fortschritt, setFortschritt] = useState(() =>
    startFortschritt(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  );

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
      : geformt
        ? texte.miniNetzBestaetigt
        : texte.miniNetzGleich;
  const hatMagNicht = netzAusGeschmack(nachher).magNicht.some((x) => x > 0); // Endstand, damit die Legende nicht während der Bewegung erscheint

  return (
    <section aria-labelledby="mini-netz-titel" className="flex flex-col items-center gap-4 text-text">
      <h3 id="mini-netz-titel" className="self-start text-h3 text-text">{texte.miniNetzTitel}</h3>
      <NetzGrafik mag={mag} magNicht={magNicht} kontur={kontur} className="w-full max-w-48" />
      {kontur || hatMagNicht ? (
        <NetzLegende mag={texte.miniNetzJetzt} magNicht={hatMagNicht ? texte.miniNetzMagNicht : null} vorher={kontur ? texte.miniNetzVorher : null} />
      ) : null}
      <p aria-live="polite" className="max-w-[48ch] text-center text-body text-text-muted text-pretty">{satz}</p>
      <Link prefetch={false} href="/profil" className={einzelLinkKlassen()}>
        {texte.miniNetzLink}
      </Link>
    </section>
  );
}
